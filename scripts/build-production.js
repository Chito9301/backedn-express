const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🏗️  Building TypeScript Backend for Production...\n")

// Clean dist directory
const distPath = path.join(process.cwd(), "dist")
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true })
  console.log("🧹 Cleaned dist directory")
}

// Build TypeScript
const buildProcess = spawn("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  cwd: process.cwd(),
})

buildProcess.on("error", (error) => {
  console.error("❌ Build failed:", error)
  process.exit(1)
})

buildProcess.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ Build completed successfully!")
    console.log("📦 Production files are in the dist/ directory")
    console.log('🚀 Run "npm start" to start the production server')
  } else {
    console.error(`\n❌ Build failed with exit code ${code}`)
    process.exit(code)
  }
})
