// routes/userRoutes.js
import { Router } from "express"
import User from "../models/User.js"
import { authMiddleware } from "./auth.routes.js"

const router = Router()

// === GET /api/users/profile ===
// (similar a /api/auth/me, lo mantenemos para compatibilidad)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" })
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// === PUT /api/users/profile === (opcional: actualizar username/email)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, email } = req.body || {}
    const updates = {}

    if (username) updates.username = username
    if (email) updates.email = email

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: "No hay cambios para actualizar" })
    }

    // Validar duplicados si cambia email/username
    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.user.id } })
      if (exists) return res.status(409).json({ error: "Email ya está en uso" })
    }
    if (username) {
      const exists = await User.findOne({ username, _id: { $ne: req.user.id } })
      if (exists) return res.status(409).json({ error: "Usuario ya está en uso" })
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true, select: "-password" },
    )
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
