import express from "express"
import { User } from "../models/User"
import { Media } from "../models/Media"
import { asyncHandler } from "../middleware/errorHandler"
import { authenticateToken, requireModerator } from "../middleware/auth"
import { cacheMiddleware } from "../middleware/cache"

const router = express.Router()

// Dashboard stats (cached for 5 minutes)
router.get(
  "/stats",
  authenticateToken,
  requireModerator,
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const [totalUsers, totalMedia, activeUsers, recentUploads, topUsers, mediaStats] = await Promise.all([
      User.countDocuments(),
      Media.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      Media.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      User.aggregate([
        {
          $lookup: {
            from: "media",
            localField: "_id",
            foreignField: "uploadedBy",
            as: "uploads",
          },
        },
        {
          $project: {
            username: 1,
            email: 1,
            uploadCount: { $size: "$uploads" },
          },
        },
        { $sort: { uploadCount: -1 } },
        { $limit: 5 },
      ]),
      Media.aggregate([
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
            totalLikes: { $sum: "$likes" },
            avgFileSize: { $avg: "$size" },
          },
        },
      ]),
    ])

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalMedia,
        activeUsers,
        recentUploads,
        topUsers,
        mediaStats: mediaStats[0] || { totalViews: 0, totalLikes: 0, avgFileSize: 0 },
      },
    })
  }),
)

// Recent activity
router.get(
  "/activity",
  authenticateToken,
  requireModerator,
  asyncHandler(async (req, res) => {
    const [recentUsers, recentMedia] = await Promise.all([
      User.find().select("username email createdAt").sort({ createdAt: -1 }).limit(10),
      Media.find()
        .populate("uploadedBy", "username")
        .select("title uploadedBy createdAt mimetype")
        .sort({ createdAt: -1 })
        .limit(10),
    ])

    res.json({
      success: true,
      activity: {
        recentUsers,
        recentMedia,
      },
    })
  }),
)

// System health
router.get(
  "/health",
  authenticateToken,
  requireModerator,
  asyncHandler(async (req, res) => {
    const dbStatus = await User.db.db.admin().ping()

    res.json({
      success: true,
      health: {
        database: dbStatus.ok === 1 ? "healthy" : "unhealthy",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    })
  }),
)

export default router
