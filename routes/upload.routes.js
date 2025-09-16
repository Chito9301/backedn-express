import { Router } from "express";
import upload from "../middlewares/upload.js";

const router = Router();

// Subir imagen de perfil
router.post("/upload/profile", upload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, error: "No se subió ninguna imagen" });
    }

    res.json({
      success: true,
      url: req.file.path, // URL pública de Cloudinary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Subir archivo/multimedia genérico
router.post("/upload/media", upload.single("file"), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, error: "No se subió ningún archivo" });
    }

    res.json({
      success: true,
      url: req.file.path,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
