import "dotenv/config" // Load environment variables first
import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import compression from "compression"
import path from "path"

// Import custom modules
import { connectDB } from "./config/database"
import { errorHandler } from "./middleware/errorHandler"
import { cacheMiddleware } from "./middleware/cache"

// Import route handlers
import authRoutes from "./routes/auth"
import userRoutes from "./routes/users"
import mediaRoutes from "./routes/media"
import dashboardRoutes from "./routes/dashboard"

// Initialize Express application
const app = express()
const PORT = process.env.PORT || 3000

// =============================================================================
// SECURITY MIDDLEWARE CONFIGURATION
// =============================================================================

// Helmet: Sets various HTTP headers to secure the app
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
)

// Compression: Compress all routes for better performance
app.use(compression())

// =============================================================================
// RATE LIMITING CONFIGURATION
// =============================================================================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // Maximum 100 requests per IP per window
  message: {
    error: "Too many requests from this IP",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
})

// Apply rate limiting to all API routes
app.use("/api/", limiter)

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true, // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
)

// =============================================================================
// BODY PARSING MIDDLEWARE
// =============================================================================

// Parse JSON payloads (limit: 10MB for media uploads)
app.use(express.json({ limit: "10mb" }))
// Parse URL-encoded payloads
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// =============================================================================
// LOGGING CONFIGURATION
// =============================================================================

// HTTP request logging (combined format includes IP, user agent, etc.)
app.use(morgan("combined"))

// =============================================================================
// CACHING MIDDLEWARE
// =============================================================================

// Cache public API responses for 5 minutes to improve performance
app.use("/api/public", cacheMiddleware(300))

// =============================================================================
// STATIC FILE SERVING
// =============================================================================

// Serve dashboard static files from /static route
app.use("/static", express.static(path.join(__dirname, "../dashboard")))

// =============================================================================
// API ROUTES CONFIGURATION
// =============================================================================

// Authentication routes: /api/auth/*
app.use("/api/auth", authRoutes)

// User management routes: /api/users/*
app.use("/api/users", userRoutes)

// Media upload/management routes: /api/media/*
app.use("/api/media", mediaRoutes)

// Dashboard API routes: /api/dashboard/*
app.use("/api/dashboard", dashboardRoutes)

// =============================================================================
// HEALTH CHECK AND MONITORING
// =============================================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || "development",
  })
})

// =============================================================================
// MAIN DASHBOARD ROUTE (ROOT)
// =============================================================================

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/index.html"))
})

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/index.html"))
})

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  })
})

// Global error handling middleware (must be last)
app.use(errorHandler)

// =============================================================================
// SERVER STARTUP
// =============================================================================

/**
 * Start the Express server with database connection
 * Handles graceful startup and error handling
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB database
    await connectDB()
    console.log("✅ Database connected successfully")

    // Start HTTP server
    app.listen(PORT, () => {
      console.log("=".repeat(50))
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`)
      console.log(`🔗 API Base: http://localhost:${PORT}/api`)
      console.log(`💚 Health Check: http://localhost:${PORT}/health`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
      console.log("=".repeat(50))
    })
  } catch (error) {
    console.error("❌ Failed to start server:", error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("👋 SIGINT received, shutting down gracefully")
  process.exit(0)
})

// Start the server
startServer()

export default app
