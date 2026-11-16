const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const Usuario = require('../models/Usuario');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * AUTENTICACIÓN: verifica el token JWT del encabezado
 *   Authorization: Bearer <token>
 * y guarda el usuario en req.usuario.
 */
const autenticar = asyncHandler(async (req, _res, next) => {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Acceso denegado: inicia sesión para continuar.');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw ApiError.unauthorized(error.name === 'TokenExpiredError'
      ? 'Tu sesión expiró. Inicia sesión de nuevo.'
      : 'Token inválido.');
  }

  const usuario = await Usuario.findById(payload.sub);
  if (!usuario) throw ApiError.unauthorized('El usuario del token ya no existe.');

  req.usuario = usuario;
  next();
});

/**
 * AUTORIZACIÓN: permite el acceso solo a ciertos roles.
 * Uso: router.post('/', autenticar, autorizar('admin'), controlador)
 */
const autorizar = (...roles) => (req, _res, next) => {
  if (!req.usuario || !roles.includes(req.usuario.rol)) {
    return next(ApiError.forbidden('Solo un administrador puede realizar esta acción.'));
  }
  next();
};

module.exports = { autenticar, autorizar };
