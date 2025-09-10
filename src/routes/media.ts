import express, { Request, Response } from "express"; // importación agregada para tipos
import { Media } from "../models/Media";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { upload, cloudinary } from "../middleware/upload";
import { clearCache } from "../middleware/cache";

const router = express.Router();

// Upload media
router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  // Aquí req es autenticado con AuthRequest, res tipado
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { title, description, tags, isPublic } = req.body;

    const media = await Media.create({
      title: title || req.file.originalname,
      description,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: req.file.path,
      cloudinaryId: req.file.filename,
      uploadedBy: req.user!.id,
      tags: tags ? tags.split(",").map((tag: string) => tag.trim()) : [],
      isPublic: isPublic !== "false",
    });

    clearCache("media");

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      media,
    });
  })
);

// Get all media
router.get(
  "/",
  // Tipado explícito para req y res
  asyncHandler(async (req: Request, res: Response) => {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const tag = req.query.tag as string;
    const sort = (req.query.sort as string) || "createdAt";

    const query: any = { isPublic: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    const sortOptions: any = {};
    switch (sort) {
      case "views":
        sortOptions.views = -1;
        break;
      case "likes":
        sortOptions.likes = -1;
        break;
      case "oldest":
        sortOptions.createdAt = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const media = await Media.find(query)
      .populate("uploadedBy", "username avatar")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const total = await Media.countDocuments(query);

    return res.json({
      success: true,
      media,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

// Get user's media
router.get(
  "/my-media",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const media = await Media.find({ uploadedBy: req.user!.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Media.countDocuments({ uploadedBy: req.user!.id });

    return res.json({
      success: true,
      media,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

// Get single media
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const media = await Media.findById(req.params.id).populate(
      "uploadedBy",
      "username avatar"
    );

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    media.views += 1;
    await media.save();

    return res.json({
      success: true,
      media,
    });
  })
);

// Update media
router.put(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    if (
      media.uploadedBy.toString() !== req.user!.id &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this media",
      });
    }

    const { title, description, tags, isPublic } = req.body;

    media.title = title || media.title;
    media.description = description || media.description;
    media.tags = tags ? tags.split(",").map((tag: string) => tag.trim()) : media.tags;
    media.isPublic = isPublic !== undefined ? isPublic : media.isPublic;

    await media.save();

    clearCache("media");

    return res.json({
      success: true,
      message: "Media updated successfully",
      media,
    });
  })
);

// Delete media
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    if (
      media.uploadedBy.toString() !== req.user!.id &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this media",
      });
    }

    try {
      await cloudinary.uploader.destroy(media.cloudinaryId);
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
    }

    await Media.findByIdAndDelete(req.params.id);

    clearCache("media");

    return res.json({
      success: true,
      message: "Media deleted successfully",
    });
  })
);

// Like media
router.post(
  "/:id/like",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const media = await Media.findById(req.params.id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    media.likes += 1;
    await media.save();

    return res.json({
      success: true,
      message: "Media liked successfully",
      likes: media.likes,
    });
  })
);

// Get trending media
router.get(
  "/public/trending",
  asyncHandler(async (req: Request, res: Response) => {
    const media = await Media.find({ isPublic: true })
      .populate("uploadedBy", "username avatar")
      .sort({ views: -1, likes: -1 })
      .limit(10);

    return res.json({
      success: true,
      media,
    });
  })
);

// Si tienes rutas wildcard en este archivo, usa el formato correcto para Express 5:
// Ejemplo:
// router.get('/:wildcard(*)', handler);

export default router;