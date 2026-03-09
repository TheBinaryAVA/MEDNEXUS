import { Request, Response, NextFunction } from 'express';
import { postService } from '../services/post.service';
import type { AuthenticatedRequest, CreatePostDto, UpdatePostDto, PostFilters } from '../types';

export class PostController {
  // POST /posts
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      const post = await postService.create(user, req.body as CreatePostDto);
      res.status(201).json({ success: true, data: { post } });
    } catch (err) {
      next(err);
    }
  }

  // GET /posts
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters: PostFilters = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        search: req.query.search as string,
        published: req.query.published !== undefined
          ? req.query.published === 'true'
          : undefined,
        authorId: req.query.authorId as string,
      };
      const result = await postService.list(filters);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // GET /posts/:id
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const post = await postService.getById(req.params.id);
      res.json({ success: true, data: { post } });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /posts/:id
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      const post = await postService.update(req.params.id, user, req.body as UpdatePostDto);
      res.json({ success: true, data: { post } });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /posts/:id
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      const hard = req.query.hard === 'true';
      await postService.delete(req.params.id, user, hard);
      res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const postController = new PostController();
