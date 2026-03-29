import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

// ─── Zod Schemas ───
const GoalSchema = z.object({
  name: z.string().min(1).max(255),
  targetValue: z.coerce.number().positive(),
  deadline: z.string().optional().nullable(),
});

const UpdateGoalSchema = GoalSchema.partial();

// GET /goals
router.get('/', async (req: AuthRequest, res: Response) => {
  const goals = await prisma.goal.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 100, // Clamp
  });
  res.json(goals);
});

// POST /goals
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = GoalSchema.parse(req.body);
    
    const g = await prisma.goal.create({
      data: {
        userId: req.userId!,
        name: data.name,
        targetValue: data.targetValue,
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });
    res.status(201).json(g);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação (Zod)', details: (err as any).errors });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao criar meta' });
  }
});

// PUT /goals/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.goal.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Meta não encontrada' }); return; }

  try {
    const data = UpdateGoalSchema.parse(req.body);
    
    const g = await prisma.goal.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.targetValue !== undefined && { targetValue: data.targetValue }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
      },
    });
    res.json(g);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação (Zod)', details: (err as any).errors });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao atualizar meta' });
  }
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
