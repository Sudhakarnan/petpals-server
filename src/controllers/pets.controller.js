import { Pet } from '../models/Pet.js'
import { User } from '../models/User.js'
import { Application } from '../models/Application.js'
import { Favorite } from '../models/Favorite.js'
import { MessageThread } from '../models/MessageThread.js'
import { Review } from '../models/Review.js'

export const listPets = async (req, res) => {
  const { page = 1, limit = 12, text, species, age, size, location, breed, shelterId, mine, excludeMine } = req.query
  const query = {}

  if (text) query.$text = { $search: text }
  if (species) query.species = species
  if (age) query.age = age
  if (size) query.size = size
  if (location) query.location = new RegExp(location, 'i')
  if (breed) query.breed = new RegExp(breed, 'i')
  if (shelterId) query.shelter = shelterId

  // If client asks for “mine”, force to current user (when token is present)
  if (mine && req.user?.id) query.shelter = req.user.id

  // If client asks to exclude my own pets in search
  if (excludeMine && req.user?.id) query.shelter = { $ne: req.user.id }

  const skip = (Number(page) - 1) * Number(limit)
  const [items, total] = await Promise.all([
    Pet.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('name species age size breed color location photos shelter createdAt')
      .populate('shelter', 'name email')
      .lean(),
    Pet.countDocuments(query),
  ])
  res.json({ items, total, totalPages: Math.ceil(total / Number(limit)) })
}


export const getPet = async (req, res) => {
  const pet = await Pet.findById(req.params.id).populate('shelter', 'name email')
  if (!pet) return res.status(404).json({ message: 'Pet not found' })
  res.json(pet)
}

export const createPet = async (req, res) => {
  const files = req.files || []
  const photos = files.map(f => `/uploads/${f.filename}`)
  const pet = await Pet.create({ ...req.body, shelter: req.user.id, photos }) // owner = current user
  res.status(201).json(pet)
}
export const updatePet = async (req, res) => {
  const pet = await Pet.findById(req.params.id)
  if (!pet) return res.status(404).json({ message: 'Pet not found' })
  if (String(pet.shelter) !== req.user.id) return res.status(403).json({ message: 'Forbidden' })
  const files = req.files || []
  const photos = files.length ? files.map((f) => `/uploads/${f.filename}`) : undefined
  const updated = await Pet.findByIdAndUpdate(
    req.params.id,
    { ...req.body, ...(photos ? { $push: { photos: { $each: photos } } } : {}) },
    { new: true }
  )
  res.json(updated)
}

export const removePet = async (req, res) => {
  const pet = await Pet.findById(req.params.id)
  if (!pet) return res.status(404).json({ message: 'Pet not found' })
  if (String(pet.shelter) !== req.user.id) return res.status(403).json({ message: 'Forbidden' })
  await pet.deleteOne()
  res.json({ ok: true })
}
  