// routes/auth.routes.js
import { Router } from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import User from "../models/User.js"

const router = Router()

// === Middleware de autenticación (exportado para otras rutas) ===
export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]
    if (!token) return res.status(401).json({ error: "Token requerido" })

    const secret = process.env.JWT_SECRET
    if (!secret) return res.status(500).json({ error: "JWT_SECRET no configurado" })

    jwt.verify(token, secret, (err, user) => {
      if (err) return res.status(403).json({ error: "Token inválido" })
      req.user = user
      next()
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// === POST /api/auth/signup ===
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body || {}
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" })
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] })
    if (exists) return res.status(409).json({ error: "Usuario o email ya existe" })

    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ username, email, password: hashed })

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" })
    return res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    })
  } catch (e) {
    // Manejo de índice único duplicado de Mongo
    if (e?.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0] || "campo"
      return res.status(409).json({ error: `El ${field} ya está en uso` })
    }
    res.status(500).json({ error: e.message })
  }
})

// === POST /api/auth/login ===
router.post("/login", async (req, res) => {
  try {
    const { email, username, password } = req.body || {}
    if ((!email && !username) || !password) {
      return res.status(400).json({ error: "Email/Usuario y contraseña son requeridos" })
    }

    const user = await User.findOne(email ? { email } : { username })
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(400).json({ error: "Contraseña incorrecta" })

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" })
    return res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// === GET /api/auth/me ===
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" })
    res.json(user)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

export default router
