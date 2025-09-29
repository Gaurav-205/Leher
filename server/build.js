const { execSync } = require('child_process')
const fs = require('fs')

console.log('🚀 Starting LEHER production build...')

try {
  // Create logs directory if it doesn't exist
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs', { recursive: true })
    console.log('✅ Created logs directory')
  }

  // Remove existing dist folder
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true })
    console.log('✅ Cleaned dist folder')
  }

  // Build TypeScript with error handling
  console.log('📦 Compiling TypeScript...')
  execSync('npx tsc', { 
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('🎉 Build completed successfully!')
  process.exit(0)
} catch (error) {
  console.error('💥 Build failed:', error.message)
  console.error('Checking if dist folder exists:', fs.existsSync('./dist'))
  process.exit(1)
}
