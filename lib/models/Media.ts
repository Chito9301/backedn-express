import type { ObjectId } from "mongodb"

export interface Media {
  _id?: ObjectId
  userId: ObjectId
  type: "image" | "video"
  url: string
  publicId: string
  caption?: string
  tags: string[]
  likes: ObjectId[]
  comments: Comment[]
  views: number
  trending: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  _id: ObjectId
  userId: ObjectId
  username: string
  text: string
  createdAt: Date
}

export interface CreateMediaData {
  userId: string
  type: "image" | "video"
  url: string
  publicId: string
  caption?: string
  tags?: string[]
}
