const ApiError = require('../utils/ApiError');

/* 404: ninguna ruta coincidió */
const noEncontrado = (req, _res, next) => {
  next(ApiError.notFound(`La ruta ${req.method} ${req.originalUrl} no existe.`));
};

/* Middleware central de errores: traduce cada tipo de error a un código HTTP claro */
// eslint-disable-next-line no-unused-vars
const manejadorErrores = (err, req, res, next) => {
  let status = err.status || 500;
  let mensaje = err.message || 'Error interno del servidor.';
  let detalles = err.detalles || null;

  if (err.name === 'CastError') {
    status = 400; mensaje = `El identificador "${err.value}" no es válido.`;
  } else if (err.name === 'ValidationError') {
    status = 400; mensaje = 'Los datos enviados no son válidos.';
    detalles = Object.values(err.errors).map((e) => ({ campo: e.path, mensaje: e.message }));
  } else if (err.code === 11000) {
    status = 409; mensaje = `Ya existe un registro con ese ${Object.keys(err.keyValue || {})[0] || 'valor'}.`;
  } else if (err.type === 'entity.parse.failed') {
    status = 400; mensaje = 'El cuerpo de la petición no es un JSON válido.';
  }

  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n`, err);
    if (process.env.NODE_ENV === 'production') mensaje = 'Error interno del servidor.';
  }

  res.status(status).json({ ok: false, error: { status, mensaje, ...(detalles && { detalles }) } });
};

module.exports = { noEncontrado, manejadorErrores };
