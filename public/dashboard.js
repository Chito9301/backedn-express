/**
 * Dashboard Management Class
 * Handles authentication, data loading, and UI updates for the admin dashboard
 */
class Dashboard {
  constructor() {
    this.token = localStorage.getItem("adminToken")
    this.baseURL = "/api"
    this.init()
  }

  /**
   * Initialize dashboard functionality
   * Shows login or dashboard based on authentication status
   */
  init() {
    this.bindEvents()
    if (this.token) {
      this.showDashboard()
      this.loadDashboardData()
    } else {
      this.showLogin()
    }
  }

  /**
   * Bind event listeners for user interactions
   */
  bindEvents() {
    const loginForm = document.getElementById("loginFormElement")
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.login()
      })
    }

    const logoutBtn = document.getElementById("logoutBtn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.logout()
      })
    }

    const refreshActivity = document.getElementById("refreshActivity")
    if (refreshActivity) {
      refreshActivity.addEventListener("click", () => {
        this.loadDashboardData()
      })
    }

    const refreshHealth = document.getElementById("refreshHealth")
    if (refreshHealth) {
      refreshHealth.addEventListener("click", () => {
        this.loadDashboardData()
      })
    }

    setInterval(() => {
      if (
        this.token &&
        document.getElementById("dashboardContent") &&
        !document.getElementById("dashboardContent").classList.contains("hidden")
      ) {
        this.loadDashboardData()
      }
    }, 30000)
  }

  /**
   * Handle user login authentication
   */
  async login() {
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const errorDiv = document.getElementById("loginError")
    const loginBtn = document.getElementById("loginBtn")
    const loginBtnText = document.getElementById("loginBtnText")
    const loginSpinner = document.getElementById("loginSpinner")

    if (loginBtn) loginBtn.disabled = true
    if (loginBtnText) loginBtnText.textContent = "Signing in..."
    if (loginSpinner) loginSpinner.classList.remove("hidden")
    if (errorDiv) errorDiv.classList.add("hidden")

    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        if (!["admin", "moderator"].includes(data.user.role)) {
          this.showError("Access denied. Admin or moderator role required.")
          return
        }

        this.token = data.token
        localStorage.setItem("adminToken", this.token)
        localStorage.setItem("adminUser", JSON.stringify(data.user))

        this.showDashboard()
        this.loadDashboardData()
      } else {
        this.showError(data.message || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      this.showError("Network error. Please try again.")
    } finally {
      if (loginBtn) loginBtn.disabled = false
      if (loginBtnText) loginBtnText.textContent = "Sign in"
      if (loginSpinner) loginSpinner.classList.add("hidden")
    }
  }

  /**
   * Show error message to user
   */
  showError(message) {
    const errorDiv = document.getElementById("loginError")
    if (errorDiv) {
      errorDiv.textContent = message
      errorDiv.classList.remove("hidden")
    }
  }

  /**
   * Handle user logout
   */
  logout() {
    this.token = null
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    this.showLogin()
  }

  /**
   * Show login form and hide dashboard
   */
  showLogin() {
    const loginForm = document.getElementById("loginForm")
    const dashboardContent = document.getElementById("dashboardContent")
    const nav = document.querySelector("nav")

    if (loginForm) loginForm.classList.remove("hidden")
    if (dashboardContent) dashboardContent.classList.add("hidden")
    if (nav) nav.classList.add("hidden")
  }

  /**
   * Show dashboard and hide login form
   */
  showDashboard() {
    const loginForm = document.getElementById("loginForm")
    const dashboardContent = document.getElementById("dashboardContent")
    const nav = document.querySelector("nav")

    if (loginForm) loginForm.classList.add("hidden")
    if (dashboardContent) dashboardContent.classList.remove("hidden")
    if (nav) nav.classList.remove("hidden")

    const user = JSON.parse(localStorage.getItem("adminUser") || "{}")
    const userInfo = document.getElementById("userInfo")
    if (userInfo && user.username) {
      userInfo.textContent = `${user.username} (${user.role || "user"})`
    }
  }

  /**
   * Make authenticated API calls
   */
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      })

      if (response.status === 401) {
        this.logout()
        return null
      }

      return await response.json()
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error)
      return null
    }
  }

  /**
   * Load all dashboard data from API endpoints
   */
  async loadDashboardData() {
    try {
      const [statsData, activityData, healthData] = await Promise.all([
        this.apiCall("/dashboard/stats"),
        this.apiCall("/dashboard/activity"),
        this.apiCall("/dashboard/health"),
      ])

      if (statsData?.success) {
        this.updateStats(statsData.stats)
      }

      if (activityData?.success) {
        this.updateActivity(activityData.activity)
      }

      if (healthData?.success) {
        this.updateHealth(healthData.health)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
  }

  /**
   * Update statistics cards with latest data
   */
  updateStats(stats) {
    const elements = {
      totalUsers: stats.totalUsers || 0,
      totalMedia: stats.totalMedia || 0,
      activeUsers: stats.activeUsers || 0,
      recentUploads: stats.recentUploads || 0,
    }

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id)
      if (element) {
        element.textContent = value.toLocaleString()
      }
    })
  }

  /**
   * Update recent activity section
   */
  updateActivity(activity) {
    const container = document.getElementById("recentActivity")
    if (!container) return

    container.innerHTML = ""

    if (activity.recentUsers && activity.recentUsers.length > 0) {
      const usersSection = document.createElement("div")
      usersSection.innerHTML = `
        <h4 class="font-medium text-gray-900 mb-2">Recent Users</h4>
        <div class="space-y-1">
          ${activity.recentUsers
            .slice(0, 5)
            .map(
              (user) => `
              <div class="text-sm text-gray-600">
                ${user.username} - ${new Date(user.createdAt).toLocaleDateString()}
              </div>
            `,
            )
            .join("")}
        </div>
      `
      container.appendChild(usersSection)
    }

    if (activity.recentMedia && activity.recentMedia.length > 0) {
      const mediaSection = document.createElement("div")
      mediaSection.innerHTML = `
        <h4 class="font-medium text-gray-900 mb-2 mt-4">Recent Uploads</h4>
        <div class="space-y-1">
          ${activity.recentMedia
            .slice(0, 5)
            .map(
              (media) => `
              <div class="text-sm text-gray-600">
                ${media.title} by ${media.uploadedBy?.username || "Unknown"} - ${new Date(media.createdAt).toLocaleDateString()}
              </div>
            `,
            )
            .join("")}
        </div>
      `
      container.appendChild(mediaSection)
    }

    if (
      (!activity.recentUsers || activity.recentUsers.length === 0) &&
      (!activity.recentMedia || activity.recentMedia.length === 0)
    ) {
      container.innerHTML = '<div class="text-sm text-gray-500">No recent activity</div>'
    }
  }

  /**
   * Update system health information
   */
  updateHealth(health) {
    const container = document.getElementById("systemHealth")
    if (!container) return

    const uptimeHours = Math.floor((health.uptime || 0) / 3600)
    const memoryUsage = Math.round((health.memory?.used || 0) / 1024 / 1024)

    container.innerHTML = `
      <div class="space-y-2">
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Database:</span>
          <span class="text-sm font-medium ${health.database === "healthy" ? "text-green-600" : "text-red-600"}">
            ${health.database || "Unknown"}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Uptime:</span>
          <span class="text-sm font-medium text-gray-900">${uptimeHours}h</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Memory Usage:</span>
          <span class="text-sm font-medium text-gray-900">${memoryUsage}MB</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Last Updated:</span>
          <span class="text-sm font-medium text-gray-900">${new Date(health.timestamp || Date.now()).toLocaleTimeString()}</span>
        </div>
      </div>
    `
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Dashboard()
})
