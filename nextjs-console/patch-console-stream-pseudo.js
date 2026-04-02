const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'app/api/console/stream/route.ts')
let code = fs.readFileSync(filePath, 'utf8')

// safety check sederhana
if (!code.includes('TransformStream') || !code.includes('type: \'chunk\'')) {
  console.error('Pattern tidak ketemu, jangan lanjut. Cek route.ts secara manual.')
  process.exit(1)
}

// replace blok async IIFE lama dengan pseudo streaming
code = code.replace(
  /;\\(async \\(\\) => \\{[\\s\\S]*?writer\\.close\\(\\) \\}\\)\\(\\)\\n\\}\\)\\(\\)/,
  `;(async () => {
  try {
    // Pseudo-stream: pecah displayText jadi potongan kecil
    const step = 20

    for (let i = 0; i < displayText.length; i += step) {
      const piece = displayText.slice(i, i + step)

      await writer.write(
        enc.encode(
          \`data: \${JSON.stringify({ type: 'chunk', content: piece })}\\n\\n\`
        )
      )
    }

    if (workflowSpec) {
      await writer.write(
        enc.encode(
          \`data: \${JSON.stringify({
            type: 'workflowspec',
            workflow: workflowSpec,
          })}\\n\\n\`
        )
      )
    }

    await writer.write(
      enc.encode(\`data: \${JSON.stringify({ type: 'done' })}\\n\\n\`)
    )
  } finally {
    try {
      await writer.close()
    } catch {
      // ignore
    }
  }
})()`
)

fs.writeFileSync(filePath, code, 'utf8')
console.log('✅ route.ts sudah dipatch untuk pseudo streaming 20 char.')
