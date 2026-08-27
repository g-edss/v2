import * as indicadoresService from '../services/indicadores.service.js';

export async function listar(_req, res, next) {
  try {
    const indicadores = await indicadoresService.listar();
    res.json(indicadores);
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      proceso_id,
      unidad_medida_id,
      frecuencia,
      meta_minima,
      meta_maxima,
      sentido,
    } = req.body;

    const frecuenciasValidas = [
      'mensual',
      'trimestral',
      'semestral',
      'anual',
    ];

    const sentidosValidos = [
      'mayor_mejor',
      'menor_mejor',
      'rango',
    ];

    const minimo = Number(meta_minima);
    const maximo = Number(meta_maxima);

    if (
      typeof codigo !== 'string' ||
      !codigo.trim() ||
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      typeof descripcion !== 'string' ||
      !descripcion.trim()
    ) {
      return res.status(400).json({
        error: 'Código, nombre y descripción son obligatorios',
      });
    }

    if (
      !Number.isInteger(Number(proceso_id)) ||
      !Number.isInteger(Number(unidad_medida_id))
    ) {
      return res.status(400).json({
        error: 'El proceso y la unidad de medida son obligatorios',
      });
    }

    if (!frecuenciasValidas.includes(frecuencia)) {
      return res.status(400).json({
        error: 'La frecuencia indicada no es válida',
      });
    }

    if (!sentidosValidos.includes(sentido)) {
      return res.status(400).json({
        error: 'El sentido del indicador no es válido',
      });
    }

    if (
      meta_minima === '' ||
      meta_minima === null ||
      meta_minima === undefined ||
      meta_maxima === '' ||
      meta_maxima === null ||
      meta_maxima === undefined ||
      !Number.isFinite(minimo) ||
      !Number.isFinite(maximo)
    ) {
      return res.status(400).json({
        error: 'Las metas mínima y máxima deben ser números',
      });
    }

    if (minimo > maximo) {
      return res.status(400).json({
        error: 'La meta mínima no puede ser mayor que la máxima',
      });
    }

    const indicador = await indicadoresService.crear({
      codigo: codigo.trim().toUpperCase(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      proceso_id: Number(proceso_id),
      unidad_medida_id: Number(unidad_medida_id),
      frecuencia,
      meta_minima: minimo,
      meta_maxima: maximo,
      sentido,
      creado_por: req.auth.sub,
    });

    res.status(201).json(indicador);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Ya existe un indicador con ese código',
      });
    }

    next(err);
  }
}

export async function actualizar(req, res, next) {
  try{
    const{
      codigo,
      nombre,
      descripcion,
      proceso_id,
      unidad_medida_id,
      frecuencia,
      meta_minima,
      meta_maxima,
      sentido,
      activo,
    } = req.body;

    const frecuenciasValidas = [
      'mensual',
      'trimestral',
      'semestral',
      'anual',
    ];

    const sentidosValidos = [
      'mayor_mejor',
      'menor_mejor',
      'rango',
    ];

    const minimo = Number(meta_minima);
    const maximo = Number(meta_maxima);

    if(
      typeof codigo !== 'string' || 
      !codigo.trim() ||
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      typeof descripcion !== 'string' ||
      !descripcion.trim()
    ) {
      return res.status(400).json({
        error: 'Código, nombre y descripción son obligatorios', 
      });
    }

    if(
      !Number.isInteger(Number(proceso_id)) ||
      !Number.isInteger(Number(unidad_medida_id))
    ){
      return res.status(400).json({
        error: 'El proceso y la unidad de medida son obligatorios',
      });
    }

    if(!frecuenciasValidas.includes(frecuencia)) {
      return res.status(400).json({
        error: 'La frecuencia indicada no es válida',
      });
    }

    if(!sentidosValidos.includes(sentido)) {
      return res.status(400).json({
        error: 'El sentido del indicador no es válido',
      });
    }

    if(
      !Number.isFinite(minimo) ||
      !Number.isFinite(maximo) ||
      minimo > maximo
    ) {
      return res.status(400).json({
        error: 'Las metas indicadas no son válidas',
      });
    }

    if(typeof activo !== 'boolean') {
      return res.status(400).json({
        error: 'El estado del indicador no es válido',
      });
    }

    const indicador = await
    indicadoresService.actualizar(
      req.params.id,
      {
        codigo: codigo.trim().toUpperCase(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        proceso_id: Number(proceso_id),
        unidad_medida_id: Number(unidad_medida_id),
        frecuencia,
        meta_minima: minimo,
        meta_maxima: maximo,
        sentido,
        activo,
      }
    );

    res.json(indicador);
  } catch(err){
    if(err.code === '23505'){
      return res.status(409).json({
        error: 'Ya existe un indicador con ese código',
      });
    }

    next(err);
  }
}

export async function desactivar(req, res, next) {
  try {
    const indicador = await indicadoresService.desactivar(
      req.params.id
    );

    res.json(indicador);
  } catch (err) {
    next(err);
  }
}