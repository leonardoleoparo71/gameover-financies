import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /goals
router.get('/', async (req: AuthRequest, res: Response) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
  });
  res.json(goals);
});

// POST /goals
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, targetValue, deadline } = req.body;

  if (!name || !targetValue) {
    res.status(400).json({ error: 'Nome e valor alvo são obrigatórios' });
    return;
  }

  const g = await prisma.goal.create({
    data: {
      userId: req.userId!,
      name,
      targetValue: Number(targetValue),
      deadline: deadline ? new Date(deadline) : null,
    },
  });
  res.status(201).json(g);
});

// PUT /goals/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.goal.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Meta não encontrada' }); return; }

  const { name, targetValue, deadline } = req.body;
  const g = await prisma.goal.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(targetValue !== undefined && { targetValue: Number(targetValue) }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
    },
  });
  res.json(g);
});

// DELETE /goals/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.goal.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Meta não encontrada' }); return; }

  await prisma.goal.delete({ where: { id } });
  res.json({ message: 'Meta removida' });
});

export default router;
