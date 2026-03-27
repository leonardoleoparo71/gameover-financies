import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /transactions
router.get('/', async (req: AuthRequest, res: Response) => {
  const { month, year } = req.query;
  const where: Record<string, unknown> = { userId: req.userId! };

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    where.date = { gte: start, lt: end };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
  });
  res.json(transactions);
});

// POST /transactions
router.post('/', async (req: AuthRequest, res: Response) => {
  const { type, category, name, amount, date } = req.body;

  if (!type || !category || !name || !amount) {
    res.status(400).json({ error: 'Campos obrigatórios: type, category, name, amount' });
    return;
  }

  const t = await prisma.transaction.create({
    data: {
      userId: req.userId!,
      type,
      category,
      name,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
    },
  });
  res.status(201).json(t);
});

// PUT /transactions/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Transação não encontrada' }); return; }

  const { type, category, name, amount, date } = req.body;
  const t = await prisma.transaction.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(category && { category }),
      ...(name && { name }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(date && { date: new Date(date) }),
    },
  });
  res.json(t);
});

// DELETE /transactions/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Transação não encontrada' }); return; }

  await prisma.transaction.delete({ where: { id } });
  res.json({ message: 'Transação removida' });
});

export default router;
