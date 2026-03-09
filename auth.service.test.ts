import { AuthService } from '../../src/services/auth.service';
import { UnauthorizedError, ConflictError } from '../../src/types/errors';
import { userRepository } from '../../src/repositories/user.repository';
import { prisma } from '../../src/config/database';

// Mock the repository
jest.mock('../../src/repositories/user.repository');
jest.mock('../../src/config/database', () => ({
  prisma: {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  // ── hashPassword ───────────────────────────────────

  describe('hashPassword', () => {
    it('should return a bcrypt hash', async () => {
      const hash = await authService.hashPassword('MyPassword1');
      expect(hash).toMatch(/^\$2[ab]\$/);
      expect(hash).not.toBe('MyPassword1');
    });

    it('should produce different hashes for the same password (salt)', async () => {
      const hash1 = await authService.hashPassword('MyPassword1');
      const hash2 = await authService.hashPassword('MyPassword1');
      expect(hash1).not.toBe(hash2);
    });
  });

  // ── comparePassword ────────────────────────────────

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const hash = await authService.hashPassword('MyPassword1');
      const result = await authService.comparePassword('MyPassword1', hash);
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const hash = await authService.hashPassword('MyPassword1');
      const result = await authService.comparePassword('WrongPassword', hash);
      expect(result).toBe(false);
    });
  });

  // ── JWT ────────────────────────────────────────────

  describe('generateAccessToken / verifyAccessToken', () => {
    it('should generate a valid JWT and verify it', () => {
      const token = authService.generateAccessToken('user-1', 'test@test.com', 'USER');
      const payload = authService.verifyAccessToken(token);
      expect(payload.sub).toBe('user-1');
      expect(payload.email).toBe('test@test.com');
      expect(payload.type).toBe('access');
    });

    it('should throw UnauthorizedError for tampered token', () => {
      const token = authService.generateAccessToken('user-1', 'test@test.com', 'USER');
      expect(() => authService.verifyAccessToken(token + 'tamper')).toThrow(UnauthorizedError);
    });
  });

  // ── register ───────────────────────────────────────

  describe('register', () => {
    it('should throw ConflictError if email already exists', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValueOnce({
        id: 'existing',
        email: 'test@test.com',
      });

      await expect(
        authService.register({ email: 'test@test.com', password: 'Password1', name: 'Test' }),
      ).rejects.toThrow(ConflictError);
    });

    it('should create user and return tokens on success', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      (userRepository.create as jest.Mock).mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@test.com',
        name: 'Test',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        passwordHash: 'hash',
        refreshToken: null,
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValueOnce({});

      const result = await authService.register({
        email: 'test@test.com',
        password: 'Password1',
        name: 'Test',
      });

      expect(result.user.email).toBe('test@test.com');
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
    });
  });

  // ── login ──────────────────────────────────────────

  describe('login', () => {
    it('should throw UnauthorizedError for non-existent user', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      await expect(
        authService.login({ email: 'nobody@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for wrong password', async () => {
      const hash = await authService.hashPassword('CorrectPass1');
      (userRepository.findByEmail as jest.Mock).mockResolvedValueOnce({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
        isActive: true,
        role: 'USER',
        name: 'Test',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        refreshToken: null,
      });

      await expect(
        authService.login({ email: 'test@test.com', password: 'WrongPass1' }),
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
