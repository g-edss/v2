// Rutas del módulo de Procesos (Diagrama 1).
// Sirve de PLANTILLA para replicar en documentos, solicitudes, auditorías y juntas.
import { Router } from 'express';
import * as controller from '../controllers/procesos.controller.js';

const router = Router();

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);

export default router;
