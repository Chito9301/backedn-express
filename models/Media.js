import mongoose from "mongoose"

const mediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  hashtags: [
    {
      type: String,
      trim: true,
    },
  ],
  type: {
    type: String,
    required: true,
    enum: ["image", "video", "audio", "document"],
    default: "image",
  },
  username: {
    type: String,
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
})

// Índices para rendimiento
mediaSchema.index({ createdBy: 1 })
mediaSchema.index({ views: -1 })
mediaSchema.index({ likes: -1 })
mediaSchema.index({ createdAt: -1 })
mediaSchema.index({ hashtags: 1 })

export default mongoose.model("Media", mediaSchema)
