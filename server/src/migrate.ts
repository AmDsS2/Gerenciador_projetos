import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres.swyvtuwkhgzlluzkwvhl:Amds2025@@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  });

  const db = drizzle(pool);

  console.log('Iniciando migração...');
  
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }

  await pool.end();
}

main(); 