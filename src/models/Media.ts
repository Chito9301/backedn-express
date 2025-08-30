import mongoose, { type Document, Schema } from "mongoose"

export interface IMedia extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  description?: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  cloudinaryId: string
  uploadedBy: mongoose.Types.ObjectId
  tags: string[]
  isPublic: boolean
  views: number
  likes: number
  createdAt: Date
  updatedAt: Date
}

const mediaSchema = new Schema<IMedia>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    cloudinaryId: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
mediaSchema.index({ uploadedBy: 1 })
mediaSchema.index({ createdAt: -1 })
mediaSchema.index({ tags: 1 })
mediaSchema.index({ isPublic: 1 })
mediaSchema.index({ views: -1 })
mediaSchema.index({ likes: -1 })

export const Media = mongoose.model<IMedia>("Media", mediaSchema)
