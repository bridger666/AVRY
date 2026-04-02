const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'app/api/console/stream/route.ts')
const code = fs.readFileSync(filePath, 'utf8')

// We look for the exact marker where TransformStream is created
const marker = 'const { readable, writable } = new TransformStream()'
if (!code.includes(marker)) {
  console.error('TransformStream marker not found, aborting.')
  process.exit(1)
}

// Build new tail of the file starting from the marker
const [head] = code.split(marker)

const newTail = `
${marker}
const writer = writable.getWriter()

;(async () => {
  try {
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
})()

return new Response(readable, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  },
})
`

fs.writeFileSync(filePath, head + newTail, 'utf8')
console.log('route.ts patched with simple pseudo streaming.')
