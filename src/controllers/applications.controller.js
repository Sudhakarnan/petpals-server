import { Application } from '../models/Application.js'
import { Pet } from '../models/Pet.js'
import { sendEmail } from '../services/email.service.js'
import { getIO } from '../socket.js'

export const createApplication = async (req, res) => {
  const { petId, about, home, havePets } = req.body
  if (!petId) return res.status(400).json({ message: 'petId is required' })

  const pet = await Pet.findById(petId).populate('shelter', 'name email')
  if (!pet) return res.status(404).json({ message: 'Pet not found' })

  const app = await Application.create({
    pet: pet._id,
    shelter: pet.shelter,     // IMPORTANT: attribute to PET OWNER
    applicant: req.user.id,   // the person applying
    about,
    home,
    havePets,
  })

  // Notify owner (non-blocking)
  try {
    await sendEmail({
      to: pet.shelter.email,
      subject: `New adoption application for ${pet.name}`,
      html: `<p>You received a new application for <b>${pet.name}</b>.</p>`,
    })
  } catch {}

  res.status(201).json(app)
   try {
    const io = getIO()
    io.to(`user:${String(app.shelter)}`).emit('application:new', app)
    io.to(`user:${String(app.applicant)}`).emit('application:created', app)
  } catch {}
}

export const listMine = async (req, res) => {
  const items = await Application.find({ applicant: req.user.id })
    .sort({ createdAt: -1 })
    .select('pet status about home havePets createdAt shelter applicant')
    .populate('pet', 'name photos shelter')
    .lean()
  res.json({ items })
}

export const listForShelter = async (req, res) => {
  // Received -> apps where I'm the pet owner
  const items = await Application.find({ shelter: req.user.id })
    .sort({ createdAt: -1 })
    .select('pet status about home havePets createdAt shelter applicant')
    .populate('pet', 'name photos')
    .populate('applicant', 'name email')
    .lean()
  res.json({ items })
}

export const updateStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const app = await Application.findById(id)
    .populate('applicant', 'email name')
    .populate('pet', 'name')
  if (!app) return res.status(404).json({ message: 'Not found' })
  if (String(app.shelter) !== req.user.id) return res.status(403).json({ message: 'Forbidden' })

  app.status = status
  await app.save()

  try {
    await sendEmail({
      to: app.applicant.email,
      subject: `Your application for ${app.pet.name} is ${status}`,
      html: `<p>Status update: <b>${status}</b> for <b>${app.pet.name}</b>.</p>`,
    })
  } catch {}

  res.json(app)
  try {
    const io = getIO()
    io.to(`user:${String(app.applicant)}`).emit('application:updated', { _id: app._id, status: app.status })
    io.to(`user:${String(app.shelter)}`).emit('application:updated', { _id: app._id, status: app.status })
  } catch {}
}

export const removeApplication = async (req, res) => {
  const { id } = req.params
  const app = await Application.findById(id)
  if (!app) return res.status(404).json({ message: 'Not found' })

  const isShelter = String(app.shelter) === req.user.id
  const isApplicant = String(app.applicant) === req.user.id
  if (!isShelter && !isApplicant) return res.status(403).json({ message: 'Forbidden' })

  await app.deleteOne()
  res.json({ ok: true })
  try {
    const io = getIO()
    io.to(`user:${String(app.applicant)}`).emit('application:removed', { _id: id })
    io.to(`user:${String(app.shelter)}`).emit('application:removed', { _id: id })
  } catch {}
}
