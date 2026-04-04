import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from '../db/schema.js';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 30, 
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Critical: Handle unexpected errors on idle clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

export const db = drizzle(pool, { schema });