import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using a temporary secret for now (NOT SECURE!).');
}const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_gameover';

import authRouter from './routes/auth';
import transactionsRouter from './routes/transactions';
import purchasesRouter from './routes/purchases';
import goalsRouter from './routes/goals';
import snapshotsRouter from './routes/snapshots';
import summaryRouter from './routes/summary';
import treeRouter from './routes/tree';
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware Manual CORS ────────────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Tratar requisição de pré-fluxo (Preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});
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
  // Temporariamente exibindo detalhes no 500 para diagnosticar o erro no Render
  res.status(500).json({ 
    error: 'Erro interno do servidor', 
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FinPlan API running on http://localhost:${PORT}`);
});

export default app;
