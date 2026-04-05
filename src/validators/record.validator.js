import { z } from 'zod';

// Reusable date string validation (YYYY-MM-DD or standard ISO format)
const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD')
  .refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date.toISOString().startsWith(val);
  }, {
    message: 'Invalid date value (e.g., Feb 31st)',
  });

export const createRecordSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be a positive number'),
    type: z.enum(['income', 'expense']),
    category: z.string().min(1, 'Category is required').max(50),
    date: dateSchema,
    notes: z.string().optional(),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const updateRecordSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be a positive number').optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().min(1).max(50).optional(),
    date: dateSchema.optional(),
    notes: z.string().optional(),
  }),
  query: z.any().optional(),
  params: z.object({
    id: z.string().uuid('Invalid record ID')
  })
});

export const getRecordsQuerySchema = z.object({
  body: z.any().optional(),
  query: z.object({
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional().default('1').transform(Number),
    limit: z.string().regex(/^\d+$/).optional().default('10').transform(Number).pipe(z.number().max(100)),
    sortBy: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional()
  }),
  params: z.any().optional(),
});

export const recordIdParamSchema = z.object({
  body: z.any().optional(),
  query: z.any().optional(),
  params: z.object({
    id: z.string().uuid('Invalid record ID')
  })
});
