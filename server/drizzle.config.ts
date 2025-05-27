import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

export default {
  schema: 'src/schema.ts',
  out: 'drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: 'aws-0-sa-east-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.swyvtuwkhgzlluzkwvhl',
    password: 'Amds2025@',
    database: 'postgres',
    ssl: true
  }
} satisfies Config; 