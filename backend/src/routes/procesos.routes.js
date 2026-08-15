import { Router } from 'express';
import * as controller from '../controllers/procesos.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', requireAuth, requireRole('admin_general'), controller.crear);

export default router;