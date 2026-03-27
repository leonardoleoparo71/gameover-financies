import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /tree
router.get('/', async (req: AuthRequest, res: Response) => {
  const nodes = await prisma.treeNode.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'asc' },
  });
  res.json(nodes);
});

// POST /tree
router.post('/', async (req: AuthRequest, res: Response) => {
  const { title, description, imageUrl, status, color, date, parentId, positionX, positionY } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Título é obrigatório' });
    return;
  }

  // Validate parentId belongs to this user
  if (parentId) {
    const parent = await prisma.treeNode.findFirst({ where: { id: parentId, userId: req.userId! } });
    if (!parent) { res.status(400).json({ error: 'Nó pai não encontrado' }); return; }
  }

  const node = await prisma.treeNode.create({
    data: {
      userId: req.userId!,
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      status: status || 'pending',
      color: color || null,
      date: date ? new Date(date) : null,
      parentId: parentId || null,
      positionX: positionX ?? 0,
      positionY: positionY ?? 0,
    },
  });
  res.status(201).json(node);
});

// PUT /tree/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.treeNode.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Nó não encontrado' }); return; }

  const { title, description, imageUrl, status, color, date, parentId, positionX, positionY } = req.body;
  const node = await prisma.treeNode.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(status !== undefined && { status }),
      ...(color !== undefined && { color }),
      ...(date !== undefined && { date: date ? new Date(date) : null }),
      ...(parentId !== undefined && { parentId }),
      ...(positionX !== undefined && { positionX }),
      ...(positionY !== undefined && { positionY }),
    },
  });
  res.json(node);
});

// DELETE /tree/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = await prisma.treeNode.findFirst({ where: { id, userId: req.userId! } });
  if (!existing) { res.status(404).json({ error: 'Nó não encontrado' }); return; }

  // Update children to remove parentId (orphan them)
  await prisma.treeNode.updateMany({ where: { parentId: id }, data: { parentId: null } });
  await prisma.treeNode.delete({ where: { id } });
  res.json({ message: 'Nó removido' });
});

export default router;
