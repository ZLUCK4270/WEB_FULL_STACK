import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Import backend API router
// @ts-expect-error CommonJS backend module
import backendModule from './backend/server.js';
const { apiRouter } = backendModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const isProduction =
  process.env.NODE_ENV === 'production' || process.argv.includes('--production');

async function startServer() {
  const app = express();

  // Security headers (OWASP best practices)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : '*';
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '10mb' }));

  // Mount backend API routes under /api
  app.use('/api', apiRouter);

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  return app.listen(PORT, HOST, () => {
    console.log(
      `Botica Nova Salud (${isProduction ? 'production' : 'development'}) running on http://${HOST}:${PORT}`
    );
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { startServer };
