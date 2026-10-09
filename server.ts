import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db.js';
import { seedInitialData } from './server/seed.js';

import authRouter from './server/routes/auth.js';
import assessmentsRouter from './server/routes/assessments.js';
import testCasesRouter from './server/routes/testCases.js';
import findingsRouter from './server/routes/findings.js';
import dashboardRouter from './server/routes/dashboard.js';
import reportsRouter from './server/routes/reports.js';
import auditLogsRouter from './server/routes/auditLogs.js';
import adminRouter from './server/routes/admin.js';
import engineRouter from './server/routes/engine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize Database & Seeds
  initDatabase();
  await seedInitialData();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Request size limit & parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security headers & basic request handling
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // REST API Endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/assessments', assessmentsRouter);
  app.use('/api/test-cases', testCasesRouter);
  app.use('/api/findings', findingsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/audit-logs', auditLogsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/engine', engineRouter);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'LLM Agent Attack Lab (DVLA)',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Safe global error handler (no stack trace disclosure in production or API responses)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({
      error: 'An unexpected application error occurred.',
      code: err.code || 'INTERNAL_SERVER_ERROR'
    });
  });

  // Frontend Serving: Vite dev server or static dist
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DVLA Server] LLM Agent Attack Lab listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[DVLA Server] Startup failed:', err);
  process.exit(1);
});
