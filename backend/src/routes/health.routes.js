// Ruta de diagnóstico: confirma que el API y la BD responden.
import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

router.get('/health', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT now() AS hora');
    res.json({ estado: 'ok', hora_db: rows[0].hora });
  } catch (err) {
    // Si la BD aún no está levantada, reporta el API arriba pero la BD abajo.
    next(err);
  }
});

export default router;
