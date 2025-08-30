export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginationQuery {
  page?: string
  limit?: string
  sort?: string
  search?: string
}

export interface PaginationResult {
  page: number
  limit: number
  total: number
  pages: number
}

export interface DashboardStats {
  totalUsers: number
  totalMedia: number
  activeUsers: number
  recentUploads: number
  topUsers: any[]
  mediaStats: {
    totalViews: number
    totalLikes: number
    avgFileSize: number
  }
}

export interface SystemHealth {
  database: "healthy" | "unhealthy"
  uptime: number
  memory: NodeJS.MemoryUsage
  timestamp: string
}
