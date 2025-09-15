import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js"; // 👉 función que debes implementar para enviar emails

const router = Router();

// =============================
// Middleware para verificar JWT
// =============================
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

// =============================
// Registro de usuario
// =============================
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
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      const duplicatedKey = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, error: `El ${duplicatedKey} ya está en uso` });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================
// Login de usuario
// =============================
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
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================
// Logout de usuario (opcional)
// =============================
router.post("/logout", (req, res) => {
  // Si usas JWT no hay sesión en servidor, el frontend solo borra el token
  res.json({ success: true, message: "Logout exitoso" });
});

// =============================
// Obtener perfil del usuario
// =============================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v");
    if (!user) return res.status(404).json({ success: false, error: "Usuario no encontrado" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =============================
// Forgot Password (solicitar reset)
// =============================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "No existe una cuenta con este correo electrónico" });

    // Generar token de reseteo
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minutos
    await user.save();

    // Enlace que llegará por email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Enviar correo (implementa sendEmail en utils)
    await sendEmail(user.email, "Restablece tu contraseña", `Haz clic en el enlace para resetear tu contraseña: ${resetUrl}`);

    res.json({ success: true, message: "Se envió un enlace de recuperación a tu correo" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// Reset Password (usar token)
// =============================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const resetTokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: "Token inválido o expirado" });

    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Nueva contraseña requerida" });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Contraseña restablecida con éxito" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
