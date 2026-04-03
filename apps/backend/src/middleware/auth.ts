import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  try {
    // Para invalidar sessões globalmente ao trocar a senha, nós lemos a ID assinada
    // e extraimos o 'securityStamp' vivo do banco de dados de forma relacional.
    const decoded = jwt.decode(token) as { userId: string } | null;
    if (!decoded || !decoded.userId) throw new Error();

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { securityStamp: true }
    });

    if (!user) throw new Error();

    // A chave real = JWT_SECRET + Stamp
    // Se o usuário trocou a senha, o Stamp mudou no banco, logo o jwt.verify FALHARÁ garantidamente
    // invalidando todas as instâncias e browsers antigos em 1 segundo.
    const secret = process.env.JWT_SECRET! + user.securityStamp;
    const payload = jwt.verify(token, secret) as { userId: string };
    
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}
