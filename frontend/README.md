# React frontend

The Vite application uses React, TypeScript, Tailwind CSS and React Query. For local development, run `npm ci` then `npm run dev` and set `VITE_API_BASE_URL=http://localhost:8000/api/v1` in `.env.local`. For Docker Compose, the frontend is built with `VITE_API_BASE_URL=/api/v1` and Nginx proxies API and WebSocket requests to the backend service.

Run `npm run typecheck` and `npm run build` before release.
