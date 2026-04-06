import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema.js';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                 // limit connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
export const db = drizzle(pool, { schema });