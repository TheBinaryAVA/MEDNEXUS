import { body, param, query } from 'express-validator';

export const authValidators = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase and a number'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters'),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
};

export const postValidators = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be 1-255 characters'),
    body('content').optional().isString().withMessage('Content must be a string'),
    body('published').optional().isBoolean().withMessage('Published must be boolean'),
  ],
  update: [
    param('id').isUUID().withMessage('Invalid post ID'),
    body('version').isInt({ min: 1 }).withMessage('Version (integer) required for updates'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be 1-255 characters'),
    body('content').optional().isString(),
    body('published').optional().isBoolean(),
  ],
  getById: [param('id').isUUID().withMessage('Invalid post ID')],
  list: [
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be 1-100'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
    query('published').optional().isBoolean().withMessage('published must be boolean'),
  ],
};
