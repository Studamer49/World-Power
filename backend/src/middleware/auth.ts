import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

type TokenPayload = {
  role?: 'admin' | 'country';
  admin?: boolean;
  countryId?: string;
};

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || (payload.role !== 'admin' && payload.admin !== true)) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
  next();
}

// Require a country-scoped token. Attaches countryId to the request.
export function requireCountry(req: Request, res: Response, next: NextFunction): void {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'country' || !payload.countryId) {
    res.status(401).json({ error: 'Invalid country token' });
    return;
  }

  (req as any).countryId = payload.countryId;
  next();
}
