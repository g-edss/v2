// Configuración de la aplicación Express (middlewares + rutas).
import express from 'express';
import cors from 'cors';

import healthRoutes from './routes/health.routes.js';
import procesosRoutes from './routes/procesos.routes.js';
import authRoutes from './routes/auth.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import auditoresRoutes from './routes/auditores.routes.js';
import indicadoresRoutes from './routes/indicadores.routes.js';
import medicionesIndicadoresRoutes from './routes/medicionesIndicadores.routes.js';
import unidadesmedidaRoutes from './routes/unidadesmedida.routes.js';
import documentosRoutes from './routes/documentos.routes.js';
import registrosRoutes from './routes/registros.routes.js';
import solicitudesRoutes from './routes/solicitudes.routes.js';
import notificacionesRoutes from './routes/notificaciones.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';


export const app = express();

app.use(cors());
app.use(express.json());

// Rutas del API (todas bajo /api)
app.use('/api', healthRoutes);
app.use('/api/procesos', procesosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auditores', auditoresRoutes);
app.use('/api/indicadores', indicadoresRoutes);
app.use('/api/indicadores', medicionesIndicadoresRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/registros', registrosRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/unidades-medida', unidadesmedidaRoutes);

// Ruta raíz informativa
app.get('/', (_req, res) => {
  res.json({ servicio: 'WEB 360 de Calidad — API', estado: 'ok' });
});

// Manejo centralizado de errores (siempre al final)
app.use(errorHandler);
