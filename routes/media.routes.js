// backend/routes/mediaRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const Media = require("../models/Media");
const { authMiddleware } = require("../middlewares/authMiddleware"); // crea este middleware aparte o ajusta

// Configurar multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Subir nuevo media
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
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
        if (error) return res.status(500).json({ error: error.message });

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
      },
    );

    uploadStream.end(file.buffer);
  } catch (err) {
    console.error("Error subiendo media:", err);
    res.status(500).json({ error: err.message });
  }
});

// Listar media trending
router.get("/trending", async (req, res) => {
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
router.get("/:id", async (req, res) => {
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

module.exports = router;
