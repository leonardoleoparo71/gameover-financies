import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

// ─── Zod Schemas ───
const TransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1),
  name: z.string().min(1).max(255),
  amount: z.coerce.number().positive(),
  date: z.string().optional()
});

const UpdateTransactionSchema = TransactionSchema.partial();

// GET /transactions
router.get('/', async (req: AuthRequest, res: Response) => {
  const { month, year } = req.query;
  const where: Record<string, unknown> = { userId: req.userId! };

  // Defesa nativa: Omitiu data? Entrega o mês corrente. Sem dump massivo do banco!
  const targetYear = year ? Number(year) : new Date().getFullYear();
  const targetMonth = month ? Number(month) : new Date().getMonth() + 1;

  const start = new Date(targetYear, targetMonth - 1, 1);
  const end = new Date(targetYear, targetMonth, 1);
  where.date = { gte: start, lt: end };

  // Hard limit virtual: Um usuário sadio não tem 500 despesas num único mes
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 500, // Clamp Final contra OOM
  });
  res.json(transactions);
});

// POST /transactions
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = TransactionSchema.parse(req.body);
    
    const t = await prisma.transaction.create({
      data: {
        userId: req.userId!,
        type: data.type,
        category: data.category,
        name: data.name,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });
    res.status(201).json(t);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação (Zod)', details: (err as any).errors });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao criar transação' });
  }
});

// PUT /transactions/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.transaction.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Transação não encontrada' }); return; }

  try {
    const data = UpdateTransactionSchema.parse(req.body);
    
    const t = await prisma.transaction.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.category && { category: data.category }),
        ...(data.name && { name: data.name }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.date && { date: new Date(data.date) }),
      },
    });
    res.json(t);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação (Zod)', details: (err as any).errors });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao atualizar transação' });
  }
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
