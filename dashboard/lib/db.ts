import { Pool } from 'pg';

// Using process.env ensures Next.js pulls the 'admin' credentials from your .env.local file
export const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: '127.0.0.1',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});