import { Router } from 'express';

import * as controller from
    '../controllers/solicitudes.controller.js';

import {
    requireAuth,
    requireRole,
} from '../middlewares/auth.js';

const router = Router();

router.get(
    '/',
    requireAuth,
    requireRole(
        'admin_general',
        'responsable',
        'revisor',
        'aprobador',
    ),
    controller.listar,
);

router.post(
    '/:id/aprobar',
    requireAuth,
    requireRole('aprobador'),
    controller.aprobar,
);

router.post(
    '/:id/avanzar',
    requireAuth,
    requireRole('responsable', 'revisor'),
    controller.avanzar,
);

router.post(
    '/:id/correcciones',
    requireAuth,
    requireRole('responsable', 'revisor', 'aprobador'),
    controller.devolver,
);

router.post(
    '/:id/rechazar',
    requireAuth,
    requireRole('responsable', 'revisor', 'aprobador'),
    controller.rechazar,
);

export default router;