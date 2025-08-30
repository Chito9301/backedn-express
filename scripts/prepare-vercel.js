const fs = require("fs")
const path = require("path")

console.log("Preparing files for Vercel deployment...")

// Ensure dashboard directory exists in the right location
const dashboardSource = path.join(__dirname, "../dashboard")
const dashboardDest = path.join(__dirname, "../dist/dashboard")

if (fs.existsSync(dashboardSource)) {
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, "../dist"))) {
    fs.mkdirSync(path.join(__dirname, "../dist"), { recursive: true })
  }

  // Copy dashboard files
  fs.cpSync(dashboardSource, dashboardDest, { recursive: true })
  console.log("✅ Dashboard files copied to dist/dashboard")
} else {
  console.warn("⚠️ Dashboard source directory not found")
}

console.log("Vercel preparation complete!")
