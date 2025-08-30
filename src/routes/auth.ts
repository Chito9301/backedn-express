import express from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User"
import { asyncHandler } from "../middleware/errorHandler"
import { authenticateToken, type AuthRequest } from "../middleware/auth"

const router = express.Router()

// Register
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      })
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    })

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRE || "7d" })

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  }),
)

// Login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      })
    }

    // Find user and include password
    const user = await User.findOne({ email }).select("+password")

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRE || "7d" })

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    })
  }),
)

// Get current user
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await User.findById(req.user!.id)

    res.json({
      success: true,
      user: {
        id: user!._id,
        username: user!.username,
        email: user!.email,
        role: user!.role,
        avatar: user!.avatar,
        lastLogin: user!.lastLogin,
        createdAt: user!.createdAt,
      },
    })
  }),
)

// Refresh token
router.post(
  "/refresh",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const token = jwt.sign({ id: req.user!.id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRE || "7d" })

    res.json({
      success: true,
      token,
    })
  }),
)

export default router
