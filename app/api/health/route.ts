import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    // Test MongoDB connection
    const client = await clientPromise
    await client.db("admin").command({ ping: 1 })

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        cloudinary: "active",
        api: "running",
      },
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      },
      { status: 500 },
    )
  }
}
