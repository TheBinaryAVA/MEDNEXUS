import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { NotFoundError } from '../types/errors';
import type { AuthenticatedRequest, CreateUserDto, LoginDto } from '../types';
import { config } from '../config';

const REFRESH_COOKIE = 'refreshToken';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.app.isProd,
    sameSite: config.app.isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    path: '/api/v1/auth/refresh',
  });
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as CreateUserDto;
      const { user, tokens } = await authService.register(dto);
      setRefreshCookie(res, tokens.refreshToken);
      res.status(201).json({
        success: true,
        data: { user, accessToken: tokens.accessToken },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as LoginDto;
      const { user, tokens } = await authService.login(dto);
      setRefreshCookie(res, tokens.refreshToken);
      res.json({ success: true, data: { user, accessToken: tokens.accessToken } });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token: string = req.cookies[REFRESH_COOKIE] as string;
      if (!token) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No refresh token' } });
        return;
      }
      const tokens = await authService.refresh(token);
      setRefreshCookie(res, tokens.refreshToken);
      res.json({ success: true, data: { accessToken: tokens.accessToken } });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      const token: string = req.cookies[REFRESH_COOKIE] as string ?? '';
      await authService.logout(user.id, token);
      res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth/refresh' });
      res.json({ success: true, message: 'Logged out' });
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = (req as AuthenticatedRequest).user;
      const user = await userRepository.findById(id);
      if (!user) throw new NotFoundError('User');
      res.json({ success: true, data: { user: UserRepository.toResponse(user) } });
    } catch (err) {
      next(err);
    }
  }
}

import { UserRepository } from '../repositories/user.repository';
export const authController = new AuthController();
