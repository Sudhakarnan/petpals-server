import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema(
  {
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    about: String,
    home: String,
    havePets: String,

    status: { type: String, enum: ['pending', 'reviewing', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
)

export const Application = mongoose.model('Application', applicationSchema)
applicationSchema.index({ applicant: 1, createdAt: -1 })
applicationSchema.index({ shelter: 1, createdAt: -1 })
applicationSchema.index({ pet: 1 })
applicationSchema.index({ status: 1 })