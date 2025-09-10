// routes/media.routes.js
import { Router } from "express"
import multer from "multer"
import { v2 as cloudinary } from "cloudinary"
import Media from "../models/Media.js"
import { authMiddleware } from "./auth.routes.js"

const router = Router()

// Multer en memoria (Vercel Serverless friendly)
const storage = multer.memoryStorage()
const upload = multer({ storage })

// === POST /api/media === (subir archivo)
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const file = req.file
    const { title, description, hashtags, type } = req.body || {}
    if (!file) return res.status(400).json({ error: "No file uploaded" })
    if (!type) return res.status(400).json({ error: "type es requerido (image|video|audio|document)" })

    const username = req.user?.username || "anonymous"

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${username}/${type}`,
        resource_type: "auto",
        context: { title, description, hashtags },
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error)
          return res.status(500).json({ error: error.message })
        }

        const media = await Media.create({
          title,
          description,
          hashtags: hashtags ? String(hashtags).split(",").map((h) => h.trim()).filter(Boolean) : [],
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

        return res.status(201).json(media)
      },
    )

    // enviar buffer al stream
    stream.end(file.buffer)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// === GET /api/media/trending ===
router.get("/trending", async (req, res) => {
  try {
    const { orderBy = "views", limit = 10 } = req.query
    const orderField = ["views", "likes", "createdAt"].includes(orderBy) ? orderBy : "views"
    const top = await Media.find().sort({ [orderField]: -1 }).limit(Number(limit) || 10)
    res.json(top)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// === GET /api/media/:id ===
router.get("/:id", async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
    if (!media) return res.status(404).json({ error: "Media no encontrada" })
    media.views += 1
    await media.save()
    res.json(media)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// Si agregas rutas wildcard en este archivo, usa el formato correcto para Express 5:
// Ejemplo:
// router.get('/:wildcard(*)', handler);

export default router
