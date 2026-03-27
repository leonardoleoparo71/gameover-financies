import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /snapshots
router.get('/', async (req: AuthRequest, res: Response) => {
  const snapshots = await prisma.monthlySnapshot.findMany({
    where: { userId: req.userId! },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  res.json(snapshots);
});

// POST /snapshots/save — save current month snapshot
router.post('/save', async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Aggregate current month transactions
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId!, date: { gte: start, lt: end } },
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSaved = totalIncome - totalExpense;

  const snapshot = await prisma.monthlySnapshot.upsert({
    where: { userId_month_year: { userId: req.userId!, month, year } },
    create: { userId: req.userId!, month, year, totalIncome, totalExpense, totalSaved },
    update: { totalIncome, totalExpense, totalSaved },
  });

  res.json(snapshot);
});

export default router;
