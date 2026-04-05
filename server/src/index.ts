import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
