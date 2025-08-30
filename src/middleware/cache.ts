import type { Request, Response, NextFunction } from "express"
import NodeCache from "node-cache"

// In-memory cache instance
const cache = new NodeCache()

export const cacheMiddleware = (duration = 300) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip cache for non-GET requests
    if (req.method !== "GET") {
      next()
      return
    }

    const key = req.originalUrl
    const cachedResponse = cache.get(key)

    if (cachedResponse) {
      console.log(`Cache hit for ${key}`)
      res.json(cachedResponse)
      return
    }

    // Store original json method
    const originalJson = res.json

    // Override json method to cache response
    res.json = function (body: any) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, duration)
        console.log(`Cached response for ${key} (${duration}s)`)
      }

      // Call original json method
      return originalJson.call(this, body)
    }

    next()
  }
}

export const clearCache = (pattern?: string): void => {
  if (pattern) {
    const keys = cache.keys()
    const matchingKeys = keys.filter((key) => key.includes(pattern))
    cache.del(matchingKeys)
    console.log(`Cleared ${matchingKeys.length} cache entries matching "${pattern}"`)
  } else {
    cache.flushAll()
    console.log("Cleared all cache entries")
  }
}

export { cache }
