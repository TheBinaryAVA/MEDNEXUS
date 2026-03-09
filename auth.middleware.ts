import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { UnauthorizedError, ForbiddenError } from '../types/errors';
import { AuthenticatedRequest, AuthenticatedUser } from '../types';
import { Role } from '@prisma/client';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = authService.verifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    } satisfies AuthenticatedUser;
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return next(new UnauthorizedError());
    if (!roles.includes(user.role)) {
      return next(new ForbiddenError(`Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

// Optional auth — attaches user if token present, doesn't fail if missing
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();

  const token = authHeader.slice(7);
  try {
    const payload = authService.verifyAccessToken(token);
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // silently ignore invalid tokens in optional auth
  }
  next();
}
