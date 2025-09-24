// =======================
// Carga variables de entorno
// =======================
import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import uploadRoutes from "./routes/upload.routes.js";
import authRoutes from './routes/auth.routes.js';
import mediaRoutes from "./routes/media.routes.js";

// Importar modelos
import User from "./models/User.js";
import Media from "./models/Media.js";

// =======================
// Crear servidor Express
// =======================
const app = express();

// Middleware para parsear JSON y urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// Configuración CORS robusta con middleware "cors" oficial
// =======================
const allowedOrigins = [
  "http://localhost:3000", // desarrollo local
  "https://mi-app-frontend-six.vercel.app", // frontend en vercel
];

app.use(cors({
  origin: function(origin, callback) {
    if(!origin) return callback(null, true); // permitir requests no CORS (móviles, curl)
    if(allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Origen CORS no permitido"));
    }
  },
  credentials: true,
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));

// =======================
// Montar rutas de Multimedia y autenticación bajo /api/auth
// =======================

app.use('/api/auth', authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/media", mediaRoutes);
// =======================
// Servir archivos estáticos desde carpeta 'public'
// IMPORTANTE: en Vercel files 'public/' se sirven automáticamente
// Express.static puede ser ignorado en Vercel para archivos en public/
// =======================
const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));

// =======================
// Middleware autenticación JWT
// =======================
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// =======================
// Ruta protegida /dashboard que sirve archivo público o SPA
// =======================
app.get("/dashboard", authMiddleware, (req, res) => {
  // sirve archivo estático protegido, o SPA login.html
  res.sendFile(path.join(publicDir, "login.html"));
});

// =======================
// Rutas API de ejemplo
// =======================

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

// Aquí agregarías las rutas de media, usuarios, login, register etc.

// =======================
// Conexión MongoDB
// =======================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error MongoDB:", err));

// =======================
// Configurar Cloudinary
// =======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =======================
// Manejo de rutas no encontradas para APIs
// =======================
app.use("/api/*", (req, res) => {
  res.status(404).json({ success: false, error: "Ruta no encontrada" });
});

// =======================
// Wildcard para SPA (dejar pasar assets y APIs)
// =======================
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.includes(".")) {
    return next();
  }
  res.sendFile(path.join(publicDir, "login.html"));
});

// =======================
// Iniciar servidor
// =======================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend corriendo en puerto ${PORT}`));
