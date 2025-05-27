import express from 'express';
import cors from 'cors';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3001;

// Configuração do banco de dados
const pool = new Pool({
  connectionString: 'postgresql://postgres.swyvtuwkhgzlluzkwvhl:Amds2025@@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

const db = drizzle(pool, { schema });

// Middleware
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API do ProjectPulse está funcionando!' });
});

// Rota para testar conexão com o banco
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query.projects.findMany();
    res.json({ message: 'Conexão com banco OK', data: result });
  } catch (error) {
    console.error('Erro ao conectar com banco:', error);
    res.status(500).json({ error: 'Erro ao conectar com banco de dados' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
}); 