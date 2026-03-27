import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';

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
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true, // allow cookies
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

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 FinPlan API running on http://localhost:${PORT}`);
});

export default app;
