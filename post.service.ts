import { Post } from '@prisma/client';
import { postRepository } from '../repositories/post.repository';
import { ForbiddenError, NotFoundError } from '../types/errors';
import type {
  CreatePostDto,
  UpdatePostDto,
  PostFilters,
  PaginatedResult,
  AuthenticatedUser,
} from '../types';

export class PostService {
  async create(user: AuthenticatedUser, dto: CreatePostDto): Promise<Post> {
    return postRepository.create(user.id, dto);
  }

  async list(filters: PostFilters): Promise<PaginatedResult<Post>> {
    return postRepository.findMany(filters);
  }

  async getById(id: string): Promise<Post> {
    const post = await postRepository.findById(id, true);
    if (!post) throw new NotFoundError('Post');
    return post;
  }

  async update(id: string, user: AuthenticatedUser, dto: UpdatePostDto): Promise<Post> {
    const post = await postRepository.findById(id);
    if (!post) throw new NotFoundError('Post');

    // Only author or admin can update
    if (post.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to update this post');
    }

    return postRepository.update(id, dto);
  }

  async delete(id: string, user: AuthenticatedUser, hard = false): Promise<void> {
    const post = await postRepository.findById(id);
    if (!post) throw new NotFoundError('Post');

    if (post.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this post');
    }

    if (hard && user.role === 'ADMIN') {
      await postRepository.hardDelete(id);
    } else {
      await postRepository.softDelete(id);
    }
  }
}

export const postService = new PostService();
