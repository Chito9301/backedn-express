import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import type { CreateUserData } from "@/lib/models/User"

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, profileImage, bio } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("test")
    const users = db.collection("users")

    const existingUser = await users.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 400 })
    }

    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const userData: CreateUserData & {
      followers: never[]
      following: never[]
      isVerified: boolean
      createdAt: Date
      updatedAt: Date
    } = {
      username,
      email,
      password: hashedPassword,
      profileImage: profileImage || "",
      bio: bio || "",
      followers: [],
      following: [],
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await users.insertOne(userData)

    const token = jwt.sign(
      {
        userId: result.insertedId,
        username,
        email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || "7d" },
    )

    return NextResponse.json(
      {
        message: "User registered successfully",
        token,
        user: {
          id: result.insertedId,
          username,
          email,
          profileImage: profileImage || "",
          bio: bio || "",
          isVerified: false,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
