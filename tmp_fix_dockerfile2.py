from pathlib import Path

path = Path(r'c:\Users\user\Documents\Software-Developer\Freelancer\aivery\nextjs-console\Dockerfile')
text = path.read_text()
old = "COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next\nCOPY --from=builder --chown=nextjs:nodejs /app/public ./public\n\nUSER nextjs\n"
new = "COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next\nCOPY --from=builder --chown=nextjs:nodejs /app/public ./public\nCOPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules\nCOPY --from=builder --chown=nextjs:nodejs /app/.pnpm ./.pnpm\nCOPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json\n\nUSER nextjs\n"
if old not in text:
    raise SystemExit('Insert point not found')
text = text.replace(old, new, 1)
if 'CMD ["node", ".next/server.js"]' not in text:
    raise SystemExit('CMD line not found')
text = text.replace('CMD ["node", ".next/server.js"]', 'CMD ["node_modules/.bin/next", "start", "-p", "3000"]', 1)
path.write_text(text)
print('patched')
