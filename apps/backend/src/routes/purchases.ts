import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /purchases
router.get('/', async (req: AuthRequest, res: Response) => {
  const purchases = await prisma.futurePurchase.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
  });
  res.json(purchases);
});

// POST /purchases
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description, value, link, imageUrl } = req.body;

  if (!name || !value) {
    res.status(400).json({ error: 'Nome e valor são obrigatórios' });
    return;
  }

  const p = await prisma.futurePurchase.create({
    data: {
      userId: req.userId!,
      name,
      description: description || null,
      value: Number(value),
      link: link || null,
      imageUrl: imageUrl || null,
    },
  });
  res.status(201).json(p);
});

// PUT /purchases/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.futurePurchase.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Compra não encontrada' }); return; }

  const { name, description, value, link, imageUrl } = req.body;
  const p = await prisma.futurePurchase.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(value !== undefined && { value: Number(value) }),
      ...(link !== undefined && { link }),
      ...(imageUrl !== undefined && { imageUrl }),
    },
  });
  res.json(p);
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
