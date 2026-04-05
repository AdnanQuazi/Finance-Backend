import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema.js';
import 'dotenv/config';

console.log(`[DB] Connecting to database at ${process.env.DATABASE_URL}`);
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });