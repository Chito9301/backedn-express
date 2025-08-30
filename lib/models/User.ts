import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  username: string
  email: string
  password: string
  profileImage?: string
  bio?: string
  followers: ObjectId[]
  following: ObjectId[]
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  profileImage?: string
  bio?: string
}
