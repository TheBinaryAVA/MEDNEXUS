import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { postValidators } from '../middleware/validators';

const router = Router();

/**
 * @openapi
 * /posts:
 *   get:
 *     summary: List posts with pagination, filtering, sorting
 *     tags: [Posts]
 */
router.get('/', validate(postValidators.list), postController.list.bind(postController));

/**
 * @openapi
 * /posts/{id}:
 *   get:
 *     summary: Get a single post by ID
 *     tags: [Posts]
 */
router.get('/:id', validate(postValidators.getById), postController.getById.bind(postController));

/**
 * @openapi
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, validate(postValidators.create), postController.create.bind(postController));

/**
 * @openapi
 * /posts/{id}:
 *   patch:
 *     summary: Partially update a post (requires version for optimistic locking)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/:id', authenticate, validate(postValidators.update), postController.update.bind(postController));

/**
 * @openapi
 * /posts/{id}:
 *   delete:
 *     summary: Soft-delete a post (admins can hard delete with ?hard=true)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, postController.delete.bind(postController));

export default router;
