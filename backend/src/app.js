// Configuración de la aplicación Express (middlewares + rutas).
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.routes.js';
import procesosRoutes from './routes/procesos.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Rutas del API (todas bajo /api)
app.use('/api', healthRoutes);
app.use('/api/procesos', procesosRoutes);

// Ruta raíz informativa
app.get('/', (_req, res) => {
  res.json({ servicio: 'WEB 360 de Calidad — API', estado: 'ok' });
});

// Manejo centralizado de errores (siempre al final)
app.use(errorHandler);
