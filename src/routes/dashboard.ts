import express from "express"
import { User } from "../models/User"
import { Media } from "../models/Media"
import { asyncHandler } from "../middleware/errorHandler"
import { authenticateToken, requireModerator } from "../middleware/auth"
import { cacheMiddleware } from "../middleware/cache"

const router = express.Router()

// =============================================================================
// DASHBOARD STATISTICS ENDPOINT
// =============================================================================

/**
 * GET /api/dashboard/stats
 * Returns comprehensive dashboard statistics including user counts, media stats,
 * and top performing users. Requires moderator access and caches results for 5 minutes.
 */
router.get(
  "/stats",
  authenticateToken, // Verify JWT token
  requireModerator, // Ensure user has moderator role
  cacheMiddleware(300), // Cache response for 5 minutes
  asyncHandler(async (req, res) => {
    // Execute all database queries in parallel for better performance
    const [totalUsers, totalMedia, activeUsers, recentUploads, topUsers, mediaStats] = await Promise.all([
      // Count total registered users
      User.countDocuments(),

      // Count total media files uploaded
      Media.countDocuments(),

      // Count users who logged in within the last 30 days
      User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),

      // Count media uploaded in the last 24 hours
      Media.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),

      // Get top 5 users by upload count using aggregation pipeline
      User.aggregate([
        {
          // Join with media collection to get upload counts
          $lookup: {
            from: "media",
            localField: "_id",
            foreignField: "uploadedBy",
            as: "uploads",
          },
        },
        {
          // Project only needed fields and calculate upload count
          $project: {
            username: 1,
            email: 1,
            uploadCount: { $size: "$uploads" },
          },
        },
        { $sort: { uploadCount: -1 } }, // Sort by upload count descending
        { $limit: 5 }, // Get top 5 users
      ]),

      // Calculate media statistics (views, likes, average file size)
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

    // Return structured response with all statistics
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalMedia,
        activeUsers,
        recentUploads,
        topUsers,
        mediaStats: mediaStats[0] || {
          totalViews: 0,
          totalLikes: 0,
          avgFileSize: 0,
        },
      },
    })
  }),
)

// =============================================================================
// RECENT ACTIVITY ENDPOINT
// =============================================================================

/**
 * GET /api/dashboard/activity
 * Returns recent user registrations and media uploads for activity monitoring.
 * Requires moderator access.
 */
router.get(
  "/activity",
  authenticateToken, // Verify JWT token
  requireModerator, // Ensure user has moderator role
  asyncHandler(async (req, res) => {
    // Fetch recent users and media in parallel
    const [recentUsers, recentMedia] = await Promise.all([
      // Get 10 most recently registered users
      User.find()
        .select("username email createdAt") // Only return necessary fields
        .sort({ createdAt: -1 }) // Sort by creation date descending
        .limit(10),

      // Get 10 most recently uploaded media files with user info
      Media.find()
        .populate("uploadedBy", "username") // Include uploader's username
        .select("title uploadedBy createdAt mimetype") // Only return necessary fields
        .sort({ createdAt: -1 }) // Sort by creation date descending
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

// =============================================================================
// SYSTEM HEALTH ENDPOINT
// =============================================================================

/**
 * GET /api/dashboard/health
 * Returns system health information including database status, server uptime,
 * and memory usage. Requires moderator access.
 */
router.get(
  "/health",
  authenticateToken, // Verify JWT token
  requireModerator, // Ensure user has moderator role
  asyncHandler(async (req, res) => {
    let dbStatus
    try {
      // Ping database to check connectivity
      dbStatus = await User.db.db.admin().ping()
    } catch (error) {
      dbStatus = { ok: 0 }
    }

    res.json({
      success: true,
      health: {
        database: dbStatus.ok === 1 ? "healthy" : "unhealthy",
        uptime: Math.floor(process.uptime()), // Server uptime in seconds
        memory: {
          // Memory usage in MB for better readability
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    })
  }),
)

export default router
