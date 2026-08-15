import { Router } from 'express';
import { crear, listar, actualizar, eliminar } from '../controllers/usuarios.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, listar);
router.post('/', requireAuth, requireAdmin, crear);
router.put('/:id', requireAuth, requireAdmin, actualizar);
router.delete('/:id', requireAuth, requireAdmin, eliminar);

export default router;