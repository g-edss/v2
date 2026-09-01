import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import * as controller from '../controllers/unidadesmedida.controller.js';

const router = Router();

router.get('/', requireAuth, controller.listar);

export default router;
