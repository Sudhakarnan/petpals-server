import { Favorite } from '../models/Favorite.js'

export const listFavorites = async (req, res) => {
  const fav = await Favorite.findOne({ user: req.user.id }).populate('petIds')
  res.json({ items: fav?.petIds || [] })
}

export const toggleFavorite = async (req, res) => {
  const { petId } = req.body
  let fav = await Favorite.findOne({ user: req.user.id })
  if (!fav) fav = await Favorite.create({ user: req.user.id, petIds: [] })
  const idx = fav.petIds.findIndex((id) => String(id) === String(petId))
  if (idx >= 0) fav.petIds.splice(idx, 1)
  else fav.petIds.push(petId)
  await fav.save()
  res.json({ ids: fav.petIds })
}