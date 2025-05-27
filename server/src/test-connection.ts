import pkg from 'pg';
const { Pool } = pkg;

async function testConnection() {
  const connectionString = 'postgresql://postgres.swyvtuwkhgzlluzkwvhl:Amds2025@@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000, // 10 segundos de timeout
    idleTimeoutMillis: 10000
  });

  try {
    console.log('Tentando conectar ao banco de dados...');
    console.log('URL de conexão:', connectionString);
    const client = await pool.connect();
    console.log('Conexão bem sucedida!');
    const result = await client.query('SELECT NOW()');
    console.log('Data atual do banco:', result.rows[0].now);
    client.release();
  } catch (error: any) {
    console.error('Erro ao conectar:', error);
    if (error.code === 'ETIMEDOUT') {
      console.log('Dica: Verifique se as credenciais estão corretas.');
    }
  } finally {
    await pool.end();
  }
}

testConnection(); 