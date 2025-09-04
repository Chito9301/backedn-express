import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import rateLimit from "express-rate-limit"
import compression from "compression"
import path from "path"
import fs from "fs"

const app = express()

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for dashboard functionality
  }),
)

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Basic middleware
app.use(compression())
app.use(morgan("combined"))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

app.get("/{*splat}", (req, res) => {
  try {
    const dashboardPath = path.join(__dirname, "../dashboard/index.html")

    // Check if file exists
    if (fs.existsSync(dashboardPath)) {
      res.sendFile(dashboardPath)
    } else {
      // Fallback HTML if file doesn't exist
      res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Retos Diarios - Dashboard</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    color: white;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container {
                    text-align: center;
                    padding: 2rem;
                    background: rgba(255,255,255,0.1);
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                }
                h1 { font-size: 2.5rem; margin-bottom: 1rem; }
                p { font-size: 1.2rem; margin-bottom: 2rem; }
                .status { color: #4CAF50; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Backend Desplegado</h1>
                <p>El servidor está funcionando correctamente</p>
                <p class="status">✅ Estado: Activo</p>
                <p>Dashboard cargando...</p>
            </div>
        </body>
        </html>
      `)
    }
  } catch (error) {
    console.error("Error serving dashboard:", error)
    res.status(500).json({ error: "Error loading dashboard" })
  }
})

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  })
})

app.get("/api/status", (req, res) => {
  res.json({
    message: "Backend API funcionando correctamente",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  })
})

app.get("*/{*splat}", (req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    path: req.path,
    method: req.method,
  })
})

export default app
