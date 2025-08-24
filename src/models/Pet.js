import mongoose from 'mongoose'

const petSchema = new mongoose.Schema(
  {
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    species: { type: String, enum: ['Dog', 'Cat', 'Rabbit', 'Bird', 'Other'], default: 'Dog' },
    age: { type: String, enum: ['Baby', 'Young', 'Adult', 'Senior'], default: 'Adult' },
    size: { type: String, enum: ['Small', 'Medium', 'Large'], default: 'Medium' },
    breed: String,
    color: String,
    location: String,
    description: String,
    medicalHistory: String,
    photos: [String],
  },
  { timestamps: true }
)

petSchema.index({ name: 'text', breed: 'text', description: 'text' })
petSchema.index({ shelter: 1, createdAt: -1 })
petSchema.index({ species: 1, age: 1, size: 1 })
export const Pet = mongoose.model('Pet', petSchema)