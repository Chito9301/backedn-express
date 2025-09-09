import express, { Request, Response } from "express"; // Importar tipos necesarios
import { User } from "../models/User";
import { Media } from "../models/Media";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticateToken, requireAdmin, type AuthRequest } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { clearCache } from "../middleware/cache";

const router = express.Router();

// Get all users (Admin only)
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    return res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

// Get user profile
router.get(
  "/profile/:id",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const mediaCount = await Media.countDocuments({ uploadedBy: user._id });

    return res.json({
      success: true,
      user: {
        ...user.toObject(),
        mediaCount,
      },
    });
  })
);

// Update profile
router.put(
  "/profile",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, email } = req.body;

    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (username !== user.username || email !== user.email) {
      const existingUser = await User.findOne({
        $and: [{ _id: { $ne: user._id } }, { $or: [{ username }, { email }] }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username or email already exists",
        });
      }
    }

    user.username = username || user.username;
    user.email = email || user.email;
    await user.save();

    clearCache("users");

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  })
);

// Upload avatar
router.post(
  "/avatar",
  authenticateToken,
  upload.single("avatar"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.avatar = req.file.path;
    await user.save();

    return res.json({
      success: true,
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  })
);

// Delete user (Admin only)
router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await Media.deleteMany({ uploadedBy: user._id });
    await User.findByIdAndDelete(req.params.id);

    clearCache("users");

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  })
);

export default router;