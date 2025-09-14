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
import authRoutes from "./routes/auth.routes.js";
// =======================
// Modelos
// =======================
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
// Configuración CORS robusta y explicativa
// =======================
const allowedOrigins = [
  "http://localhost:3000", // desarrollo local
  "https://mi-app-frontend-six.vercel.app", // frontend en vercel
];
app.use("/api/auth", authRoutes);
// Middleware CORS personalizado
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") {
    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: `CORS: El origen ${origin} no está permitido.` });
    }
    res.setHeader("Allow", "GET,POST,PUT,DELETE,OPTIONS");
    return res.sendStatus(204);
  }
  next();
});

// =======================
// Servir dashboard estático
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
// Dashboard API status
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

// =======================
// Ruta /dashboard protegida por JWT
// =======================
app.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    res.sendFile(path.join(publicDir, "index.html"));
  } catch (err) {
    res.status(500).send("Error cargando dashboard");
  }
});

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
// Configurar multer
// =======================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// =======================
// Rutas Auth
// =======================

// Registro
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "Todos los campos son requeridos" });

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists)
      return res.status(400).json({ error: "Usuario o email ya existe" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
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
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Rutas Media
// =======================

// Subir media
app.post("/api/media", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { title, description, hashtags, type } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const username = req.user.username;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${username || "anonymous"}/${type || "media"}`,
        resource_type: "auto",
        context: { title, description, hashtags },
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: error.message });
        }

        const media = new Media({
          title,
          description,
          hashtags: hashtags ? hashtags.split(",").map((h) => h.trim()) : [],
          type,
          username,
          mediaUrl: result.secure_url,
          publicId: result.public_id,
          createdBy: req.user.id,
          createdAt: new Date(),
          views: 0,
          likes: 0,
          comments: 0,
        });

        await media.save();
        res.json(media);
      }
    );

    uploadStream.end(file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar media trending
app.get("/api/media/trending", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const { orderBy = "views", limit = 10 } = req.query;
  const validFields = ["views", "likes", "comments", "createdAt"];
  const sortField = validFields.includes(orderBy) ? orderBy : "views";
  const lim = Number(limit);

  if (isNaN(lim) || lim < 1 || lim > 100) {
    return res.status(400).json({
      success: false,
      error: "El parámetro 'limit' debe ser un número entre 1 y 100."
    });
  }

  try {
    const media = await Media.find()
      .sort({ [sortField]: -1 })
      .limit(lim);
    return res.status(200).json({
      success: true,
      data: media
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Error interno al obtener los medios trending."
    });
  }
});

// Obtener media por id
app.get("/api/media/:id", async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: "Media no encontrada" });

    media.views += 1;
    await media.save();

    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Rutas User
// =======================
app.get("/api/users/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// Handler 404
// =======================
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Ruta no encontrada" });
});

// =======================
// Wildcard para frontend (debe ir al final)
// =======================
app.get("/:splat(*)", (req, res) => {
  return res.sendFile(path.join(publicDir, "index.html"), (err) => {
    if (err) {
      console.error("Error sirviendo dashboard:", err);
      res.status(500).send("Error cargando dashboard");
    }
  });
});

// =======================
// Iniciar servidor
// =======================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend corriendo en puerto ${PORT}`));
