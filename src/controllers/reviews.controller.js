import { Review } from '../models/Review.js'

export const listReviews = async (req, res) => {
  const { targetType, targetId } = req.query
  const items = await Review.find({ targetType, targetId }).sort({ createdAt: -1 })
  res.json({ items })
}

export const createReview = async (req, res) => {
  const { targetType, targetId, rating, comment } = req.body
  const review = await Review.create({ targetType, targetId, rating, comment, author: req.user.id })
  res.status(201).json(review)
}