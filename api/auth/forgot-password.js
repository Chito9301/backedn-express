import express from "express";
import crypto from "crypto";
import User from "../models/User.js"; // tu modelo
import sendEmail from "../utils/sendEmail.js"; // función para enviar correos

const router = express.Router();

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Generar token de reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = Date.now() + 1000 * 60 * 15; // 15 minutos

    // Guardar en la DB (puedes añadir estos campos a tu modelo User si aún no existen)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    // URL de frontend para resetear contraseña
    const resetURL = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    // Enviar correo
    await sendEmail({
      to: user.email,
      subject: "Restablecer contraseña",
      text: `Has solicitado restablecer tu contraseña. Haz clic aquí: ${resetURL}`,
    });

    return res.json({ message: "Correo de recuperación enviado" });
  } catch (err) {
    console.error("Error en forgot-password:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

export default router;
