import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import type { CorsOptions } from 'cors';

function loadLocalEnv() {
  if (process.env.VERCEL) return;
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

function resolveCorsOrigin(): CorsOptions['origin'] {
  const raw = process.env.CLIENT_URL;
  if (raw) {
    const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length === 1) return list[0];
    return list;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:5280';
}

export function createApp() {
  loadLocalEnv();

  const app = express();

  app.use(
    cors({
      origin: resolveCorsOrigin(),
      credentials: true,
    }),
  );

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: 'Athena Financial',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/public/stats', (_req, res) => {
    res.json({
      organizationsHelped: 2400,
      transactionsSyncedDisplay: '12M+',
      partnerConnectors: 8,
      tagline: 'Nonprofits use Athena Financial to see cash flow across every account they rely on.',
    });
  });

  return app;
}
