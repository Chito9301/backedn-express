<<<<<<< HEAD
// c3cf65c (Corrige conflictos y formatea backend con Prettier)
// Backend completo
//

=======
>>>>>>> 6ff354b (index corregido de Prettier)
// Carga variables de entorno
import "dotenv/config"
import express from "express"
import mongoose from "mongoose"
import multer from "multer"
import cloudinary from "cloudinary"
import cors from "cors"
import jwt from "jsonwebtoken"
import path from "path"

// Modelos
import User from "./models/User.js"
import Media from "./models/Media.js"

// =======================
// Configuración CORS
// =======================
const allowedOrigins = [
  "http://localhost:3000",
  "https://mi-app-frontend-six.vercel.app", // 👈 ajusta si usas otra URL
]

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true) // permitir Postman, curl, etc.
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: El origen ${origin} no está permitido.`))
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
}

// =======================
// Crear servidor Express
// =======================
const app = express()
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// =======================
// Servir dashboard estático
// =======================
const dashboardDir = path.join(process.cwd(), "dashboard") // usar process.cwd() para compatibilidad ESM
app.use("/dashboard-assets", express.static(dashboardDir)) // assets si quieres ofrecer rutas directas

// Si quieres servirlo en la raíz URL '/', descomenta la ruta '/' de abajo que devuelve el index.html.
// Mantengo la ruta /dashboard para que no rompa API existentes.
app.get("/dashboard", (req, res) => {
  return res.sendFile(path.join(dashboardDir, "index.html"), (err) => {
    if (err) {
      console.error("Error sirviendo dashboard:", err)
      res.status(500).send("Error cargando dashboard")
    }
  })
})

// Si prefieres que el dashboard se sirva en la raíz '/', puedes usar esta ruta (descomenta):
/*
app.get('/', (req, res) => {
  return res.sendFile(path.join(dashboardDir, 'index.html'), (err) => {
    if (err) {
      console.error('Error sirviendo dashboard en /:', err);
      res.status(500).send('Error cargando dashboard');
    }
  });
});
*/

// =======================
// Middleware autenticación JWT (no tocar)
// =======================
function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]
  if (!token) return res.status(401).json({ error: "Token requerido" })

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" })
    req.user = user
    next()
  })
}

// =======================
// Dashboard / test server (API) - si quieres mantener el antiguo endpoint JSON para checks
// NO se elimina — es la comprobación API, distinta de la UI estática
// =======================
app.get("/api/status", async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? "Conectada ✅" : "Desconectada ❌"
    const cloudStatus = cloudinary.v2.config().cloud_name ? "Conectado ✅" : "Desconectado ❌"
    const userCount = await User.countDocuments()
    const mediaCount = await Media.countDocuments()

    res.json({
      message: "🚀 Backend funcionando correctamente",
      mongoDB: mongoStatus,
      cloudinary: cloudStatus,
      frontendUrl: process.env.NEXT_PUBLIC_API_URL,
      stats: { usuarios: userCount, medias: mediaCount },
    })
  } catch (err) {
    res.status(500).json({ error: "Error cargando dashboard" })
  }
})

// =======================
// Conexión MongoDB
// =======================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error MongoDB:", err))

// =======================
// Configurar Cloudinary
// =======================
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// =======================
// Configurar multer (no tocar)
// =======================
const storage = multer.memoryStorage()
const upload = multer({ storage })

// =======================
<<<<<<< HEAD
\
// Rutas Auth (register + login)
// c3cf65c (Corrige conflictos y formatea backend con Prettier)
=======
// Rutas Auth (sin cambios)
// =======================

// Registro
>>>>>>> 6ff354b (index corregido de Prettier)
app.post('/api/auth/register', async (req, res) =>
{
  try {
    const { username, email, password } = req.body
    if (!username || !email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos' });

    const userExists = await User.findOne({ $or: [{ username }, { email }] })
    if (userExists) return res.status(400).json({ error: 'Usuario o email ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ username, email, password: hashedPassword })
    await user.save()

    res.status(201).json({ message: "Usuario registrado correctamente" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
)

// Login
app.post(\'/api/auth/login\', async (req, res) => {
try {
  \
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Todos los campos son requeridos' });

  const user = await User.findOne({ email })
  if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(400).json({ error: 'Contraseña incorrecta' });

  const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "7d" })
  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email },
  })
} catch (err) {
  res.status(500).json({ error: err.message })
}
})

\
// =======================
<<<<<<< HEAD
// Rutas Media (upload, trending, getById)
// c3cf65c (Corrige conflictos y formatea backend con Prettier)
=======
// Rutas Media (sin cambios)
// =======================

// Subir media
>>>>>>> 6ff354b (index corregido de Prettier)
app.post('/api/media', authMiddleware, upload.single('file'), async (req, res) =>
{
  try {
    const { title, description, hashtags, type } = req.body
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const username = req.user.username

    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: `${username || "anonymous"}/${type || "media"}`,
        resource_type: "auto",
        context: { title, description, hashtags },
      },
      async (error, result) => {
        <<<<<<< HEAD
\
        if (error) {
          console.error("Cloudinary upload error:", error)
          return res.status(500).json({ error: error.message })
        }
        //c3cf65c (Corrige conflictos y formatea backend con Prettier)
        =======
\
        if (error) return res.status(500).json({ error: error.message })

        \
>>>>>>> 6ff354b (index corregido de Prettier)
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
        })

        await media.save()
        res.json(media)
      },
    )

    uploadStream.end(file.buffer)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
)

\
// Listar media trending
app.get('/api/media/trending', async (req, res) =>
{
  try {
    const { orderBy = "views", limit = 10 } = req.query
    const media = await Media.find()
      .sort({ [orderBy]: -1 })
      .limit(Number(limit))
    res.json(media)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
)

\
// Obtener media por id
app.get('/api/media/:id', async (req, res) =>
{
  try {
    const media = await Media.findById(req.params.id)
    if (!media) return res.status(404).json({ error: 'Media no encontrada' });

    media.views += 1
    await media.save()

    res.json(media)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
)

\
// =======================
<<<<<<< HEAD
// Rutas User
// c3cf65c (Corrige conflictos y formatea backend con Prettier)
=======
// Rutas User (sin cambios)
// =======================

// Perfil del usuario autenticado
>>>>>>> 6ff354b (index corregido de Prettier)
app.get('/api/users/profile', authMiddleware, async (req, res) =>
{
  try {
    const user = await User.findById(req.user.id).select("-password")
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
)

\
// =======================
// Manejo de rutas inválidas
// =======================
app.use((req, res) =>
{
  res.status(404).json({ error: "Ruta no encontrada" })
}
)

\
// =======================
// Iniciar servidor
// =======================
const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`✅ Backend corriendo en puerto ${PORT}`))
