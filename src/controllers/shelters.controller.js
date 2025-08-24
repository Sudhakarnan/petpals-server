import { User } from '../models/User.js'
import { Pet } from '../models/Pet.js'

export const getShelter = async (req, res) => {
  const shelter = await User.findById(req.params.id).select('name email city state about role')
  if (!shelter || shelter.role !== 'shelter') return res.status(404).json({ message: 'Shelter not found' })
  const pets = await Pet.find({ shelter: shelter._id }).sort({ createdAt: -1 })
  res.json({ _id: shelter._id, name: shelter.name, email: shelter.email, city: shelter.city, state: shelter.state, about: shelter.about, pets })
}