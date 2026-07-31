// Pool de conexiones a PostgreSQL.
// Toda consulta a la base pasa por aquí.
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

// Helper corto para consultas parametrizadas.
export const query = (text, params) => pool.query(text, params);
