import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userRepository } from '../repositories/user.repository';
import { prisma } from '../config/database';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
} from '../types/errors';
import type { CreateUserDto, LoginDto, JwtPayload, UserResponseDto } from '../types';
import { Role } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // ── Hashing ────────────────────────────────────────

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.auth.bcryptRounds);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  // ── JWT ────────────────────────────────────────────

  generateAccessToken(userId: string, email: string, role: Role): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      role,
      type: 'access',
    };
    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtAccessExpiresIn,
    } as jwt.SignOptions);
  }

  generateRefreshToken(userId: string, email: string, role: Role): string {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      role,
      type: 'refresh',
    };
    return jwt.sign(payload, config.auth.jwtRefreshSecret, {
      expiresIn: config.auth.jwtRefreshExpiresIn,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.auth.jwtRefreshSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  // ── Auth flows ─────────────────────────────────────

  async register(dto: CreateUserDto): Promise<{ user: UserResponseDto; tokens: AuthTokens }> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictError('Email already registered');

    const passwordHash = await this.hashPassword(dto.password);
    const user = await userRepository.create({ ...dto, passwordHash });

    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.role);
    return { user: UserRepository.toResponse(user) as UserResponseDto, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: UserResponseDto; tokens: AuthTokens }> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedError('Account is disabled');

    const valid = await this.comparePassword(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.role);
    return { user: UserRepository.toResponse(user) as UserResponseDto, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshToken);
    if (payload.type !== 'refresh') throw new UnauthorizedError('Invalid token type');

    // Validate token exists in DB (rotation validation)
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired or revoked');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedError('User not found or inactive');

    // Rotate: delete old, issue new
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    return this.generateAndStoreTokens(user.id, user.email, user.role);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { OR: [{ token: refreshToken }, { userId }] },
    });
  }

  private async generateAndStoreTokens(
    userId: string,
    email: string,
    role: Role,
  ): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(userId, email, role);
    const refreshToken = this.generateRefreshToken(userId, email, role);

    // Store refresh token in DB with expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken };
  }
}

// Re-export for convenience
import { UserRepository } from '../repositories/user.repository';
export const authService = new AuthService();
