import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

import authRouter from './routes/auth';
import transactionsRouter from './routes/transactions';
import purchasesRouter from './routes/purchases';
import goalsRouter from './routes/goals';
import snapshotsRouter from './routes/snapshots';
import summaryRouter from './routes/summary';
import treeRouter from './routes/tree';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Para facilitar o deploy inicial e comportar múltiplos domínios da Vercel
    // Retornamos 'true' para permitir qualquer origem que chegue até aqui
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/transactions', transactionsRouter);
app.use('/purchases', purchasesRouter);
app.use('/goals', goalsRouter);
app.use('/snapshots', snapshotsRouter);
app.use('/summary', summaryRouter);
app.use('/tree', treeRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Erro interno do servidor', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FinPlan API running on http://localhost:${PORT}`);
});

export default app;
