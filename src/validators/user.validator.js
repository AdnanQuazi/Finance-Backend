import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['viewer', 'analyst', 'manager', 'admin']).optional(),
    status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional()
  }),
  query: z.any().optional(),
  params: z.any().optional()
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['viewer', 'analyst', 'manager', 'admin'])
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().uuid('Invalid user ID')
  })
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'inactive', 'suspended', 'pending'])
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().uuid('Invalid user ID')
  })
});

export const userIdParamSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().uuid('Invalid user ID')
  })
});
