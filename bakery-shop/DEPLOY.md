# Deployment (shared hosting)

- Build in production mode only. Avoid dev/Turbopack on the server as it spawns many workers.
- Install production deps: `npm ci --omit=dev`
- Build: `npm run build:prod`
- Start: `NODE_ENV=production PORT=3000 npm run start`
- Ensure the hosting panel uses the `start` script (never `dev`). If process limits are low, keep `NEXT_CPU_COUNT=2` in the environment. 
