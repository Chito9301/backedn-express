const fs = require("fs")
const path = require("path")

/**
 * Copy dashboard files to dist folder after TypeScript compilation
 * This ensures dashboard files are available in production builds
 */
function copyDashboard() {
  const sourceDir = path.join(__dirname, "../dashboard")
  const targetDir = path.join(__dirname, "../dist/dashboard")

  console.log("📁 Copying dashboard files...")
  console.log(`Source: ${sourceDir}`)
  console.log(`Target: ${targetDir}`)

  try {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // Copy all files from dashboard to dist/dashboard
    const files = fs.readdirSync(sourceDir)

    files.forEach((file) => {
      const sourcePath = path.join(sourceDir, file)
      const targetPath = path.join(targetDir, file)

      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, targetPath)
        console.log(`✅ Copied: ${file}`)
      }
    })

    console.log("🎉 Dashboard files copied successfully!")
  } catch (error) {
    console.error("❌ Error copying dashboard files:", error)
    process.exit(1)
  }
}

// Run the copy function
copyDashboard()
