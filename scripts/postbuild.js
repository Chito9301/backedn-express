const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

/**
 * Post-build script to ensure all necessary files are in place
 * Runs after TypeScript compilation to prepare for deployment
 */
console.log("🔧 Running post-build tasks...")

try {
  // Copy dashboard files
  console.log("📁 Copying dashboard files...")
  execSync("node scripts/copy-dashboard.js", { stdio: "inherit" })

  // Verify critical files exist
  const criticalFiles = ["dist/index.js", "dist/dashboard/index.html", "dist/dashboard/dashboard.js"]

  console.log("🔍 Verifying build output...")
  criticalFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`)
    } else {
      console.error(`❌ Missing: ${file}`)
      process.exit(1)
    }
  })

  console.log("🎉 Post-build tasks completed successfully!")
} catch (error) {
  console.error("❌ Post-build failed:", error)
  process.exit(1)
}
