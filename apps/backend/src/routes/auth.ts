import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendWelcomeEmail, sendResetPasswordEmail, sendLoginAlertEmail, sendPasswordChangedEmail } from '../services/email';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per `window` (here, per 15 minutes)
  message: { error: 'Muitas tentativas de autenticação, tente novamente mais tarde.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// POST /auth/register
router.post('/register', authLimiter, async (req: Request, res: Response) => {
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
  });

  const secret = process.env.JWT_SECRET! + user.securityStamp;
  const token = jwt.sign({ userId: user.id }, secret, {
    expiresIn: '30d',
  });

  sendWelcomeEmail(user.email, user.name);

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, createdAt: user.createdAt } });
});

// POST /auth/login
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email e senha são obrigatórios' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const secret = process.env.JWT_SECRET! + user.securityStamp;
  const token = jwt.sign({ userId: user.id }, secret, {
    expiresIn: '30d',
  });

  // Dispara alerta de login (Assíncrono)
  sendLoginAlertEmail(user.email, user.name, req.headers['user-agent'] || 'Desconhecido', req.ip || 'Desconhecido');

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
  });
});

// POST /auth/google
router.post('/google', authLimiter, async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Token do Google obrigatório' });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) throw new Error('Google payload inválido');

    let user = await prisma.user.findUnique({ where: { email: payload.email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name || 'Usuário Google',
          googleId: payload.sub,
          avatarUrl: payload.picture,
        }
      });
      sendWelcomeEmail(user.email, user.name);
    } else if (!user.googleId) {
      // Merge account se ele já tinha criado via email mas agora usou o Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, avatarUrl: payload.picture || user.avatarUrl }
      });
    }

    const secret = process.env.JWT_SECRET! + user.securityStamp;
    const sessionToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '30d' });

    sendLoginAlertEmail(user.email, user.name, req.headers['user-agent'] || 'Desconhecido', req.ip || 'Desconhecido');

    res.cookie('token', sessionToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
    });
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ error: 'Autenticação com Google falhou. Verifique se o GOOGLE_CLIENT_ID está configurado no Backend.' });
  }
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
router.post('/forgot-password', authLimiter, async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email é obrigatório' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (user) {
    // Secret contains user securityStamp, if token is generated, it relies on it
    const secret = process.env.JWT_SECRET! + user.securityStamp;
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'reset-password' }, 
      secret, 
      { expiresIn: '1h' }
    );
    
    sendResetPasswordEmail(user.email, user.name, resetToken);
  }

  res.json({ message: 'Se o email estiver cadastrado, um link de recuperação será enviado.' });
});

// POST /auth/reset-password
router.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
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
    const decodedPayload = jwt.decode(token) as { userId: string, purpose: string } | null;
    if (!decodedPayload || decodedPayload.purpose !== 'reset-password') {
      res.status(400).json({ error: 'Token inválido para esta operação' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decodedPayload.userId } });
    if (!user) {
      res.status(400).json({ error: 'Usuário não encontrado' });
      return;
    }

    const secret = process.env.JWT_SECRET! + user.securityStamp;
    const decoded = jwt.verify(token, secret) as { userId: string, purpose: string };

    const hashed = await bcrypt.hash(newPassword, 12);
    
    // ATUALIZAR SECURITY STAMP: isso irá derrubar todas as outras sessões instantaneamente!
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashed, securityStamp: uuidv4() },
    });

    sendPasswordChangedEmail(updatedUser.email, updatedUser.name);

    res.json({ message: 'Senha atualizada com sucesso!' });
  } catch (err) {
    res.status(400).json({ error: 'Link de recuperação expirado ou inválido' });
  }
});

// GET /auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, name: true, email: true, avatarUrl: true, salary: true, createdAt: true },
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
    select: { id: true, name: true, email: true, avatarUrl: true, salary: true, createdAt: true },
  });

  res.json({ user });
});

export default router;
