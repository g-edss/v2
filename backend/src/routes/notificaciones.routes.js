import { Router } from 'express';
import * as controller from '../controllers/notificaciones.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get(
    '/',
    requireAuth,
    controller.listar,
);

router.patch(
    '/:id/leida',
    requireAuth,
    controller.marcarLeida,
);

export default router;