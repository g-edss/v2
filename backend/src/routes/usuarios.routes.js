import { Router } from 'express';
import { crear } from '../controllers/usuarios.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.post('/', requireAuth, requireAdmin, crear);

export default router;