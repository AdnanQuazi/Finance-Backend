import { z } from 'zod';

export const trendsSchema = z.object({
  query: z.object({
    period: z.enum(['monthly', 'weekly']).default('monthly'),
    from: z.string().date().optional(),
    to: z.string().date().optional(),
  }),
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
