import path from 'node:path';
import multer from 'multer';

const TAMANO_MAXIMO = 25 * 1024 * 1024;

const TIPOS_PERMITIDOS = new Map([
    ['.pdf', ['application/pdf']],
    ['.doc', ['application/msword']],
    [
        '.docx',
        [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
    ],
    ['.xls', ['application/vnd.ms-excel']],
    [
        '.xlsx',
        [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
    ],
    ['.ppt', ['application/vnd.ms-powerpoint']],
    [
        '.pptx',
        [
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
    ],
    ['.png', ['image/png']],
    ['.jpg', ['image/jpeg']],
    ['.jpeg', ['image/jpeg']],
]);

function crearErrorCarga(mensaje) {
    const error = new Error(mensaje);
    error.status = 400;
    error.publico = mensaje;
    return error;
}

function validarArchivo(_req, archivo, callback) {
    const extension = path.extname(archivo.originalname).toLowerCase();
    const tiposMime = TIPOS_PERMITIDOS.get(extension);

    if (!tiposMime || !tiposMime.includes(archivo.mimetype)) {
        return callback(
            crearErrorCarga(
                'Formato no permitido. Usa PDF, Word, Excel, PowerPoint, PNG o JPEG.',
            ),
        );
    }

    callback(null, true);
}

const carga = multer({
    storage: multer.memoryStorage(),
    fileFilter: validarArchivo,
    limits: {
        fileSize: TAMANO_MAXIMO,
        files: 1,
        fields: 10,
        parts: 11,
        fieldNameSize: 100,
        fieldSize: 1024 * 1024,
        fieldArrayIndexLimit: 10,
    },
});

export function subirDocumento(req, res, next) {
    carga.single('archivo')(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            const mensajes = {
                LIMIT_FILE_SIZE: 'El archivo supera el límite de 25 MB.',
                LIMIT_FILE_COUNT: 'Solo se permite subir un archivo.',
                LIMIT_UNEXPECTED_FILE:
                    'El formulario contiene un archivo no esperado.',
                LIMIT_FIELD_COUNT: 'El formulario contiene demasiados campos.',
                LIMIT_PART_COUNT: 'El formulario contiene demasiadas partes.',
            };

            return next(
                crearErrorCarga(
                    mensajes[error.code] || 'No se pudo procesar el archivo enviado.',
                ),
            );
        }

        next(error);
    });
}