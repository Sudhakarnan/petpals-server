import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    petIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
  },
  { timestamps: true }
)

export const Favorite = mongoose.model('Favorite', favoriteSchema)