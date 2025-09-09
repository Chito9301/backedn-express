import express, { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { User } from "../models/User";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticateToken, type AuthRequest } from "../middleware/auth";

const router = express.Router();

// Registro de usuario
router.post(
  "/register",
  asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      // Retorno aquí evita error TS7030 en caso usuario exista
      return res.status(400).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Crear usuario
    const user = await User.create({
      username,
      email,
      password,
    });

    // Generar JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || "7d" } as SignOptions
    );

    // Return añadido para asegurar siempre retorno en función
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  }),
);

// Login
router.post(
  "/login",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || "7d" } as SignOptions
    );

    // Return añadido para evitar error TS7030
    return res.json({
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
    });
  }),
);

// Obtener usuario actual autenticado
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user!.id);

    return res.json({
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
    });
  }),
);

// Refrescar token
router.post(
  "/refresh",
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const token = jwt.sign(
      { id: req.user!.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRE || "7d" } as SignOptions
    );

    return res.json({
      success: true,
      token,
    });
  }),
);

export default router;