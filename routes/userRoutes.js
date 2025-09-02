// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById } = require("../controllers/userControllers");

// Obtener todos los usuarios
router.get("/", getAllUsers);

// Obtener usuario por ID
router.get("/:id", getUserById);

module.exports = router;
