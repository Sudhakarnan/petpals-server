import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const threadSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
    messages: [messageSchema],
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
)

threadSchema.index({ participants: 1, updatedAt: -1 })
threadSchema.index({ 'messages.createdAt': -1 })
export const MessageThread = mongoose.model('MessageThread', threadSchema)