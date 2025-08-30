class Dashboard {
  constructor() {
    this.token = localStorage.getItem("adminToken")
    this.baseURL = "/api"
    this.init()
  }

  init() {
    this.bindEvents()
    if (this.token) {
      this.showDashboard()
      this.loadDashboardData()
    } else {
      this.showLogin()
    }
  }

  bindEvents() {
    // Login form
    document.getElementById("loginBtn").addEventListener("click", (e) => {
      e.preventDefault()
      this.login()
    })

    // Logout button
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.logout()
    })

    // Auto-refresh dashboard every 30 seconds
    setInterval(() => {
      if (this.token && !document.getElementById("loginForm").classList.contains("hidden")) {
        this.loadDashboardData()
      }
    }, 30000)
  }

  async login() {
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const errorDiv = document.getElementById("loginError")

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
        // Check if user has admin/moderator role
        if (!["admin", "moderator"].includes(data.user.role)) {
          errorDiv.textContent = "Access denied. Admin or moderator role required."
          errorDiv.classList.remove("hidden")
          return
        }

        this.token = data.token
        localStorage.setItem("adminToken", this.token)
        localStorage.setItem("adminUser", JSON.stringify(data.user))

        this.showDashboard()
        this.loadDashboardData()
      } else {
        errorDiv.textContent = data.message || "Login failed"
        errorDiv.classList.remove("hidden")
      }
    } catch (error) {
      console.error("Login error:", error)
      errorDiv.textContent = "Network error. Please try again."
      errorDiv.classList.remove("hidden")
    }
  }

  logout() {
    this.token = null
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    this.showLogin()
  }

  showLogin() {
    document.getElementById("loginForm").classList.remove("hidden")
    document.getElementById("dashboardContent").classList.add("hidden")
    document.querySelector("nav").classList.add("hidden")
  }

  showDashboard() {
    document.getElementById("loginForm").classList.add("hidden")
    document.getElementById("dashboardContent").classList.remove("hidden")
    document.querySelector("nav").classList.remove("hidden")

    // Show user info
    const user = JSON.parse(localStorage.getItem("adminUser") || "{}")
    document.getElementById("userInfo").textContent = `${user.username} (${user.role})`
  }

  async apiCall(endpoint, options = {}) {
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

    return response.json()
  }

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

  updateStats(stats) {
    document.getElementById("totalUsers").textContent = stats.totalUsers.toLocaleString()
    document.getElementById("totalMedia").textContent = stats.totalMedia.toLocaleString()
    document.getElementById("activeUsers").textContent = stats.activeUsers.toLocaleString()
    document.getElementById("recentUploads").textContent = stats.recentUploads.toLocaleString()
  }

  updateActivity(activity) {
    const container = document.getElementById("recentActivity")
    container.innerHTML = ""

    // Recent users
    if (activity.recentUsers.length > 0) {
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

    // Recent media
    if (activity.recentMedia.length > 0) {
      const mediaSection = document.createElement("div")
      mediaSection.innerHTML = `
                <h4 class="font-medium text-gray-900 mb-2 mt-4">Recent Uploads</h4>
                <div class="space-y-1">
                    ${activity.recentMedia
                      .slice(0, 5)
                      .map(
                        (media) => `
                        <div class="text-sm text-gray-600">
                            ${media.title} by ${media.uploadedBy.username} - ${new Date(media.createdAt).toLocaleDateString()}
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `
      container.appendChild(mediaSection)
    }
  }

  updateHealth(health) {
    const container = document.getElementById("systemHealth")
    const uptimeHours = Math.floor(health.uptime / 3600)
    const memoryUsage = Math.round(health.memory.used / 1024 / 1024)

    container.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-sm text-gray-600">Database:</span>
                    <span class="text-sm font-medium ${health.database === "healthy" ? "text-green-600" : "text-red-600"}">
                        ${health.database}
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
                    <span class="text-sm font-medium text-gray-900">${new Date(health.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
        `
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new Dashboard()
})
