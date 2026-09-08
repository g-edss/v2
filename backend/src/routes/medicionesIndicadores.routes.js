import { Router } from 'express';
import {
    requireAuth,
    requireRole,
} from '../middlewares/auth.js';
import * as controller from '../controllers/medicionesIndicadores.controller.js';

const router = Router();

const rolesIndicadores = [
    'admin_general',
    'responsable',
    'revisor',
    'aprobador',
];

router.get(
    '/:indicadorId/mediciones',
    requireAuth,
    requireRole(...rolesIndicadores),
    controller.listarPorIndicador
);

router.post(
    '/:indicadorId/mediciones',
    requireAuth,
    requireRole(...rolesIndicadores),
    controller.crear
);

router.put(
    '/:indicadorId/mediciones/:medicionId',
    requireAuth,
    requireRole(...rolesIndicadores),
    controller.actualizar
);

router.delete(
    '/:indicadorId/mediciones/:medicionId',
    requireAuth,
    requireRole('admin_general'),
    controller.eliminar
);

export default router;