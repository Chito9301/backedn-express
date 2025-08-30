const { spawn } = require("child_process")
const path = require("path")

console.log("🚀 Starting TypeScript Backend Development Server...\n")

// Load environment variables
require("dotenv").config()

// Start the development server
const devServer = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: process.cwd(),
})

devServer.on("error", (error) => {
  console.error("❌ Failed to start development server:", error)
  process.exit(1)
})

devServer.on("close", (code) => {
  console.log(`\n📊 Development server exited with code ${code}`)
  process.exit(code)
})

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down development server...")
  devServer.kill("SIGINT")
})

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down development server...")
  devServer.kill("SIGTERM")
})
