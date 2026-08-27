import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import * as controller from '../controllers/indicadores.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listar);

router.post(
  '/',
  requireAuth,
  requireRole('admin_general'),
  controller.crear
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin_general'),
  controller.actualizar
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin_general'),
  controller.desactivar
);

export default router;