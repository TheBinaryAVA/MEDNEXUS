import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/config/database';
import { authService } from '../../src/services/auth.service';
import { userRepository } from '../../src/repositories/user.repository';

const app = createApp();

describe('POST /api/v1/posts (integration)', () => {
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create a real user
    const passwordHash = await authService.hashPassword('Password1');
    const user = await userRepository.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password1',
      passwordHash,
    });
    userId = user.id;
    accessToken = authService.generateAccessToken(user.id, user.email, user.role);
  });

  it('should create a post and return 201', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Hello World', content: 'My first post', published: false });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post.title).toBe('Hello World');
    expect(res.body.data.post.authorId).toBe(userId);
  });

  it('should return 422 when title is missing', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'No title here' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .send({ title: 'Unauthorized post' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/posts (integration)', () => {
  beforeEach(async () => {
    const passwordHash = await authService.hashPassword('Password1');
    const user = await userRepository.create({
      email: 'author@example.com',
      name: 'Author',
      password: 'Password1',
      passwordHash,
    });
    // Seed posts
    await prisma.post.createMany({
      data: [
        { title: 'Post 1', published: true, authorId: user.id },
        { title: 'Post 2', published: false, authorId: user.id },
        { title: 'Post 3', published: true, authorId: user.id },
      ],
    });
  });

  it('should return paginated posts', async () => {
    const res = await request(app)
      .get('/api/v1/posts')
      .query({ page: 1, limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.totalPages).toBe(2);
    expect(res.body.meta.hasNext).toBe(true);
  });

  it('should filter by published', async () => {
    const res = await request(app)
      .get('/api/v1/posts')
      .query({ published: 'true' });

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(2);
    res.body.data.forEach((p: { published: boolean }) => expect(p.published).toBe(true));
  });

  it('should search by title', async () => {
    const res = await request(app)
      .get('/api/v1/posts')
      .query({ search: 'Post 1' });

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].title).toBe('Post 1');
  });
});

describe('GET /api/v1/posts/:id (integration)', () => {
  it('should return 404 for non-existent post', async () => {
    const res = await request(app)
      .get('/api/v1/posts/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
