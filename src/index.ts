import "dotenv/config" // Added dotenv configuration at the top
import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import compression from "compression"
import path from "path"
import { connectDB } from "./config/database"
import { errorHandler } from "./middleware/errorHandler"
import { cacheMiddleware } from "./middleware/cache"
import authRoutes from "./routes/auth"
import userRoutes from "./routes/users"
import mediaRoutes from "./routes/media"
import dashboardRoutes from "./routes/dashboard"

const app = express()
const PORT = process.env.PORT || 3000

// Security middleware
app.use(helmet())
app.use(compression())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging
app.use(morgan("combined"))

// Cache middleware for static routes
app.use("/api/public", cacheMiddleware(300)) // 5 minutes cache

// Serve dashboard static files
app.use("/dashboard", express.static(path.join(__dirname, "../dashboard")))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/media", mediaRoutes)
app.use("/api/dashboard", dashboardRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Dashboard route
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../dashboard/index.html"))
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" })
})

// Error handling middleware
app.use(errorHandler)

// Start server
const startServer = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Dashboard available at http://localhost:${PORT}/dashboard`)
      console.log(`🔗 API available at http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

export default app
