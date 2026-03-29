import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendWelcomeEmail, sendResetPasswordEmail } from '../services/email';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email já cadastrado' });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '12h',
  });

  // Disparar envio de email assíncrono para o fundo (não trava a resposta)
  sendWelcomeEmail(user.email, user.name);

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true, // Always true for SameSite: none
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.status(201).json({ user, token });
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '12h',
  });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    token,
  });
});

// POST /auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
  res.json({ message: 'Logout realizado com sucesso' });
});

// POST /auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email é obrigatório' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  // Por segurança, não confirmamos se o email existe ou não (prevenção de enumeração)
  if (user) {
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'reset-password' }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '1h' }
    );
    
    // Dispara o email em background
    sendResetPasswordEmail(user.email, user.name, resetToken);
  }

  res.json({ message: 'Se o email estiver cadastrado, um link de recuperação será enviado.' });
});

// POST /auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Senha deve ter ao menos 6 caracteres' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string, purpose: string };
    
    if (decoded.purpose !== 'reset-password') {
      res.status(400).json({ error: 'Token inválido para esta operação' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashed },
    });

    res.json({ message: 'Senha atualizada com sucesso!' });
  } catch (err) {
    res.status(400).json({ error: 'Link de recuperação expirado ou inválido' });
  }
});

// GET /auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, name: true, email: true, salary: true, createdAt: true },
  });

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  res.json({ user });
});

// PUT /auth/profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { salary, name } = req.body;

  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      ...(salary !== undefined && { salary: Number(salary) }),
      ...(name && { name }),
    },
    select: { id: true, name: true, email: true, salary: true, createdAt: true },
  });

  res.json({ user });
});

export default router;
