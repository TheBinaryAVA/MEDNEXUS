import { Post, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { CreatePostDto, UpdatePostDto, PostFilters, PaginatedResult } from '../types';
import { ConflictError } from '../types/errors';

export class PostRepository {
  async findById(id: string, includeAuthor = false): Promise<Post | null> {
    return prisma.post.findFirst({
      where: { id, deletedAt: null },
      include: includeAuthor ? { author: true } : undefined,
    });
  }

  async findMany(filters: PostFilters): Promise<PaginatedResult<Post>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      published,
      authorId,
    } = filters;

    const skip = (page - 1) * limit;
    const take = Math.min(limit, 100); // cap at 100

    // Build where clause
    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(published !== undefined && { published }),
      ...(authorId && { authorId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Allowlist sortable columns to prevent injection
    const allowedSortColumns = ['createdAt', 'updatedAt', 'title'];
    const orderByField = allowedSortColumns.includes(sortBy) ? sortBy : 'createdAt';

    const [data, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        skip,
        take,
        orderBy: { [orderByField]: sortOrder },
        include: { author: { select: { id: true, name: true, email: true } } },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNext: page * take < total,
        hasPrev: page > 1,
      },
    };
  }

  async create(authorId: string, data: CreatePostDto): Promise<Post> {
    return prisma.post.create({
      data: {
        title: data.title.trim(),
        content: data.content,
        published: data.published ?? false,
        authorId,
      },
    });
  }

  async update(id: string, data: UpdatePostDto): Promise<Post> {
    const { version, ...fields } = data;

    // Optimistic concurrency: only update if version matches
    const updated = await prisma.post.updateMany({
      where: { id, version, deletedAt: null },
      data: { ...fields, version: { increment: 1 } },
    });

    if (updated.count === 0) {
      throw new ConflictError(
        'Post has been modified by another request. Fetch the latest version and retry.',
      );
    }

    return prisma.post.findUniqueOrThrow({ where: { id } });
  }

  async softDelete(id: string): Promise<void> {
    await prisma.post.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await prisma.post.delete({ where: { id } });
  }
}

export const postRepository = new PostRepository();
