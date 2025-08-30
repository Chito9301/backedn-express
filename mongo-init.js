// MongoDB initialization script for Docker
const { connect } = require("mongodb") // Declare the connect variable
const db = connect("mongodb://localhost:27017/admin") // Declare the db variable
const targetDb = db.getSiblingDB("backend-express")

// Create collections
targetDb.createCollection("users")
targetDb.createCollection("media")

// Create indexes for better performance
targetDb.users.createIndex({ email: 1 }, { unique: true })
targetDb.users.createIndex({ username: 1 }, { unique: true })
targetDb.users.createIndex({ createdAt: -1 })

targetDb.media.createIndex({ uploadedBy: 1 })
targetDb.media.createIndex({ createdAt: -1 })
targetDb.media.createIndex({ tags: 1 })
targetDb.media.createIndex({ isPublic: 1 })
targetDb.media.createIndex({ views: -1 })
targetDb.media.createIndex({ likes: -1 })

// Create admin user (optional)
targetDb.users.insertOne({
  username: "admin",
  email: "admin@example.com",
  password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS", // password: admin123
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
})

print("Database initialized successfully!")
