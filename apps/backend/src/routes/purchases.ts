import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

// ─── Zod Schemas ───
const PurchaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  value: z.coerce.number().positive(),
  link: z.union([z.string().url(), z.literal('')]).optional().nullable(),
  imageUrl: z.union([z.string().url(), z.literal('')]).optional().nullable(),
});

const UpdatePurchaseSchema = PurchaseSchema.partial();

// GET /purchases
router.get('/', async (req: AuthRequest, res: Response) => {
  const purchases = await prisma.futurePurchase.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 100, // Clamp
  });
  res.json(purchases);
});

// POST /purchases
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = PurchaseSchema.parse(req.body);
    
    const p = await prisma.futurePurchase.create({
      data: {
        userId: req.userId!,
        name: data.name,
        description: data.description || null,
        value: data.value,
        link: data.link || null,
        imageUrl: data.imageUrl || null,
      },
    });
    res.status(201).json(p);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação (Zod)', details: (err as any).errors });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao criar compra' });
  }
});

// PUT /purchases/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.futurePurchase.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Compra não encontrada' }); return; }

  try {
    const data = UpdatePurchaseSchema.parse(req.body);
    
    const p = await prisma.futurePurchase.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.link !== undefined && { link: data.link }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
      },
    });
    res.json(p);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Erro de validação (Zod)', details: (err as any).errors });
      return;
    }
    res.status(500).json({ error: 'Erro interno ao atualizar compra' });
  }
});

// DELETE /purchases/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.futurePurchase.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Compra não encontrada' }); return; }

  await prisma.futurePurchase.delete({ where: { id } });
  res.json({ message: 'Compra removida' });
});

export default router;
