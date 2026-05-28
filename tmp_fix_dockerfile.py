from pathlib import Path

path = Path(r'c:\Users\user\Documents\Software-Developer\Freelancer\aivery\nextjs-console\Dockerfile')
text = path.read_text()
old = """# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built output
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=\"0.0.0.0\"

CMD [\"node\", \".next/server.js\"]
"""
new = """# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built output and runtime dependencies
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.pnpm ./.pnpm
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=\"0.0.0.0\"

CMD [\"node_modules/.bin/next\", \"start\", \"-p\", \"3000\"]
"""
if old not in text:
    raise SystemExit('Old Dockerfile block not found; please inspect the file manually.')
path.write_text(text.replace(old, new))
print('Dockerfile updated')
