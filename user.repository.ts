import { User, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { CreateUserDto } from '../types';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async create(data: CreateUserDto & { passwordHash: string }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        passwordHash: data.passwordHash,
      },
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async update(
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // Strip sensitive fields for responses
  static toResponse(user: User): Omit<User, 'passwordHash' | 'refreshToken'> {
    const { passwordHash: _pw, refreshToken: _rt, ...safe } = user;
    return safe;
  }
}

export const userRepository = new UserRepository();
