import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import cookieParser from "cookie-parser";

import authRoutes from './routes/auth.routes.js';

import User from "./models/User.js";
import Media from "./models/Media.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "https://mi-app-frontend-six.vercel.app",
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origen CORS no permitido"));
  },
  credentials: true,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use('/api/auth', authRoutes);

const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Token requerido" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// POST login modified para enviar cookie token y redirigir
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Todos los campos son requeridos" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Guardar token en cookie httpOnly
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
      // secure: true // habilitar si usas HTTPS
    });

    res.json({ success: true, redirectTo: "/dashboard" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/dashboard", authMiddleware, (req, res) => {
  res.sendFile(path.join(publicDir, "login.html"));
});

app.get("/api/status", async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? "Conectada ✅" : "Desconectada ❌";
    const cloudStatus = cloudinary.config().cloud_name ? "Conectado ✅" : "Desconectado ❌";
    const userCount = await User.countDocuments();
    const mediaCount = await Media.countDocuments();
    res.json({
      message: "🚀 Backend funcionando correctamente",
      mongoDB: mongoStatus,
      cloudinary: cloudStatus,
      frontendUrl: process.env.FRONTEND_URL || "https://mi-app-frontend-six.vercel.app",
      stats: { usuarios: userCount, medias: mediaCount }
    });
  } catch (err) {
    res.status(500).json({ error: "Error cargando dashboard" });
  }
});

// Aquí agregarías las otras rutas como media, usuarios, etc.

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch(err => console.error("❌ Error MongoDB:", err));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, error: "Ruta no encontrada" });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.includes(".")) return next();
  res.sendFile(path.join(publicDir, "login.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend corriendo en puerto ${PORT}`));
