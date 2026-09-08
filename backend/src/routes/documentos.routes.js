import { Router } from 'express';

import * as controller from '../controllers/documentos.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { subirDocumento } from '../middlewares/uploadDocumento.js';

const router = Router();

const rolesArchivos = [
    'admin_general',
    'responsable',
    'revisor',
    'aprobador',
    'visor',
];

router.get(
    '/tipos',
    requireAuth,
    controller.listarTipos,
);

router.get(
    '/participantes',
    requireAuth,
    requireRole('admin_general', 'responsable'),
    controller.listarParticipantes,
);

router.get(
    '/visor',
    requireAuth,
    controller.listarVisor,
);

router.get(
    '/',
    requireAuth,
    requireRole(
        'admin_general',
        'responsable',
        'revisor',
        'aprobador',
    ),
    controller.listarControl,
);

router.get(
    '/:id/versiones/:versionId/pdf',
    requireAuth,
    requireRole(...rolesArchivos),
    controller.verPdf,
);

router.get(
    '/:id/versiones/:versionId/original',
    requireAuth,
    requireRole(...rolesArchivos),
    controller.descargarOriginal,
);

router.post(
    '/:id/versiones/:versionId/correccion',
    requireAuth,
    requireRole('admin_general', 'responsable'),
    subirDocumento,
    controller.reemplazarCorreccion,
);

router.post(
    '/:id/versiones/:versionId/enviar-revision',
    requireAuth,
    requireRole('admin_general', 'responsable'),
    controller.enviarRevision,
);

router.post(
    '/',
    requireAuth,
    requireRole('admin_general', 'responsable'),
    subirDocumento,
    controller.crear,
);

export default router;