import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";

const router = Router();

// =======================
// Middleware para verificar JWT
// =======================
export function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "JWT_SECRET no configurado" });

  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// =======================
// Registro de usuario
// =======================
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ success: false, error: "Todos los campos son requeridos" });

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser)
      return res.status(409).json({ success: false, error: "Usuario o email ya existe" });

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =======================
// Login de usuario
// =======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: "Email y contraseña son requeridos" });

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ success: false, error: "Credenciales inválidas" });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ success: false, error: "Credenciales inválidas" });

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =======================
// Olvidé contraseña
// =======================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1h
    await user.save();

    // ⚠️ Aquí deberías enviar email real con token
    res.json({
      success: true,
      message: "Se envió un enlace de recuperación al correo",
      resetUrl: `/reset-password/${token}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Resetear contraseña
// =======================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password");

    if (!user) return res.status(400).json({ error: "Token inválido o expirado" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Contraseña actualizada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Perfil de usuario
// =======================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v");
    if (!user) return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
