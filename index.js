// =======================
// Ruta /api/dashboard: datos reales para el frontend
// =======================
app.get("/api/dashboard", async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? "Conectada ✅" : "Desconectada ❌";
    const cloudStatus = cloudinary.config().cloud_name ? "Conectado ✅" : "Desconectado ❌";
    const userCount = await User.countDocuments();
    const mediaCount = await Media.countDocuments();
    res.json({
      mongoDB: mongoStatus,
      cloudinary: cloudStatus,
      usuarios: userCount,
      medias: mediaCount
    });
  } catch (err) {
    res.status(500).json({ error: "Error cargando datos del dashboard" });
  }
});
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

// =======================
// Modelos
// =======================
import User from "./models/User.js";
import Media from "./models/Media.js";

// =======================
// Configuración CORS robusta y explicativa
// =======================
const allowedOrigins = [
  "http://localhost:3000", // desarrollo local
  "https://mi-app-frontend-six.vercel.app", // frontend en vercel
  // Agrega aquí otros dominios permitidos
];

// Middleware CORS personalizado para control total
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  // Si el origen no está permitido, mostrar error claro en preflight
  if (req.method === "OPTIONS") {
    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: `CORS: El origen ${origin} no está permitido.` });
    }
    res.setHeader("Allow", "GET,POST,PUT,DELETE,OPTIONS");
    return res.sendStatus(204); // Preflight OK
  }
  next();
});

// =======================
// Crear servidor Express
// =======================
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// Servir dashboard estático
// =======================
const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));

// NOTA: Cambié esta ruta a formato correcto para Express 5 - wildcard nombrado con parámetro y asterisco
app.get("/:splat(*)", (req, res) => {
  // Se corrigió el nombre del parámetro wildcard para Express 5 (de /*:splat a /:splat(*))
  return res.sendFile(path.join(publicDir, "index.html"), (err) => {
    if (err) {
      console.error("Error sirviendo dashboard:", err);
      res.status(500).send("Error cargando dashboard");
    }
  });
});

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
    const mongoStatus =
      mongoose.connection.readyState === 1 ? "Conectada ✅" : "Desconectada ❌";
    const cloudStatus = cloudinary.config().cloud_name
      ? "Conectado ✅"
      : "Desconectado ❌";
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
// Ruta /dashboard: autenticación básica y datos reales
// =======================
app.get("/dashboard", async (req, res) => {
  // Autenticación básica
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", "Basic realm='Dashboard'");
    return res.status(401).send("Autenticación requerida");
  }
  const credentials = Buffer.from(auth.split(" ")[1], "base64").toString().split(":");
  const [user, pass] = credentials;
  if (user !== "admin" || pass !== "admin") {
    return res.status(403).send("Credenciales inválidas");
  }
  try {
    // Obtener datos reales del backend
    const mongoStatus = mongoose.connection.readyState === 1 ? "Conectada ✅" : "Desconectada ❌";
    const cloudStatus = cloudinary.config().cloud_name ? "Conectado ✅" : "Desconectado ❌";
    const userCount = await User.countDocuments();
    const mediaCount = await Media.countDocuments();
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
  try {
    const { orderBy = "views", limit = 10 } = req.query;
    const media = await Media.find()
      .sort({ [orderBy]: -1 })
      .limit(Number(limit));
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
// Manejo de rutas inválidas
// =======================
// Se corrigió ruta wildcard sin nombre para compatibilidad con Express 5 (de /*:path a /:path(*))
app.use("/:path(*)", (req, res) => {
  res.status(404).send("Not Found");
});

// =======================
// Iniciar servidor
// =======================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Backend corriendo en puerto ${PORT}`));
