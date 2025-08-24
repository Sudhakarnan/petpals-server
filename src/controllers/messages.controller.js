import { MessageThread } from '../models/MessageThread.js'

export const listThreads = async (req, res) => {
 const threads = await MessageThread.find({ participants: req.user.id })
    .sort({ updatedAt: -1 })
    .populate('participants', 'name')
    .lean()
  const items = (threads || []).map((t) => {
    const msgs = Array.isArray(t.messages) ? t.messages : []
    return {
      _id: t._id,
      otherParty: (t.participants || []).find((p) => String(p._id) !== req.user.id) || null,
      lastMessage: msgs[msgs.length - 1] || null,
      messages: msgs.map((m) => ({ ...m, fromSelf: String(m.from) === req.user.id })),
    }
  })
  res.json({ items })
}

export const getThread = async (req, res) => {
  const t = await MessageThread.findOne({ _id: req.params.id, participants: req.user.id })
    .populate('participants', 'name')
    .populate('pet', 'name')
  if (!t) return res.status(404).json({ message: 'Not found' })
  res.json({
    _id: t._id,
    otherParty: t.participants.find(p => String(p._id) !== req.user.id),
    pet: t.pet ? { _id: t.pet._id, name: t.pet.name } : null,
    messages: t.messages.map(m => ({ ...m.toObject(), fromSelf: String(m.from) === req.user.id })),
  })
}

export const startThread = async (req, res) => {
  const { toUserId, petId } = req.body
  if (!toUserId) return res.status(400).json({ message: 'toUserId is required' })

  let thread =
    await MessageThread.findOne({ participants: { $all: [req.user.id, toUserId] }, ...(petId ? { pet: petId } : {}) })
      .populate('participants', 'name')
      .lean()

  if (!thread) {
    const created = await MessageThread.create({ participants: [req.user.id, toUserId], pet: petId, messages: [] })
    thread = (await MessageThread.findById(created._id).populate('participants', 'name').lean())
  }

  const msgs = Array.isArray(thread.messages) ? thread.messages : []
  res.status(201).json({
    _id: thread._id,
    otherParty: (thread.participants || []).find((p) => String(p._id) !== req.user.id) || null,
    lastMessage: msgs[msgs.length - 1] || null,
    messages: msgs.map((m) => ({ ...m, fromSelf: String(m.from) === req.user.id })),
    pet: thread.pet || null,
  })
}


export const sendMessage = async (req, res) => {
  const { threadId, toUserId, text, petId } = req.body
  let thread
  if (threadId) {
    thread = await MessageThread.findOne({ _id: threadId, participants: req.user.id })
  } else {
    let query = { participants: { $all: [req.user.id, toUserId] } }
    if (petId) query = { ...query, pet: petId }
    thread = await MessageThread.findOne(query)
    if (!thread) thread = await MessageThread.create({ participants: [req.user.id, toUserId], pet: petId, messages: [] })
  }
  if (!thread) return res.status(404).json({ message: 'Thread not found' })
  const msg = { from: req.user.id, text }
  thread.messages.push(msg)
  await thread.save()
  res.status(201).json({ ...msg, fromSelf: true, createdAt: new Date() })
  try {
    const io = getIO()
    const other =
      thread.participants.find((p) => String(p) !== req.user.id)
    io.to(`user:${String(other)}`).emit('message:new', {
      threadId: thread._id,
      text,
      from: req.user.id,
      createdAt: new Date(),
    })
      } catch { }
}

export const deleteMessageForMe = async (req, res) => {
  const { id, messageId } = req.params
  const t = await MessageThread.findOne({ _id: id, participants: req.user.id })
  if (!t) return res.status(404).json({ message: 'Thread not found' })

  const m = t.messages.id(messageId)
  if (!m) return res.status(404).json({ message: 'Message not found' })

  if (!m.deletedFor) m.deletedFor = []
  const already = m.deletedFor.some((u) => String(u) === req.user.id)
  if (!already) m.deletedFor.push(req.user.id)

  await t.save()
  res.json({ ok: true, messageId })
}

