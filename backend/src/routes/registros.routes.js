import { Router } from 'express';

import * as controller from '../controllers/registros.controller.js';
import {
    requireAuth,
    requireRole
} from '../middlewares/auth.js';
import {
    subirDocumento
} from '../middlewares/uploadDocumento.js';

const router = Router();

router.get(
    '/',
    requireAuth,
    controller.listar
);

router.get(
    '/:id/archivo',
    requireAuth,
    controller.descargarArchivo
);

router.post(
    '/:id/enviar-revision',
    requireAuth,
    requireRole(
        'admin_general',
        'responsable'
    ),
    controller.enviarRevision
);

router.get(
    '/:id',
    requireAuth,
    controller.obtener
);

router.post(
    '/',
    requireAuth,
    requireRole(
        'admin_general',
        'responsable'
    ),
    subirDocumento,
    controller.crear
);

export default router;