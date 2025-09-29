const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('Starting LEHER build process...')

try {
  // Create logs directory
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs', { recursive: true })
  }

  // Build TypeScript
  console.log('Building TypeScript...')
  execSync('npx tsc --project tsconfig.prod.json', { stdio: 'inherit' })

  console.log('✅ Build successful!')
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}
