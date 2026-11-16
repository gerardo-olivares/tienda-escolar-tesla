const { body, param, query, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const { NIVELES } = require('../models/Producto');

/* Reúne los errores de express-validator y responde 400 con el detalle por campo */
const validar = (req, _res, next) => {
  const resultado = validationResult(req);
  if (resultado.isEmpty()) return next();
  const detalles = resultado.array().map(({ path, msg }) => ({ campo: path, mensaje: msg }));
  next(ApiError.badRequest('Los datos enviados no son válidos.', detalles));
};

const idValido = [param('id').isMongoId().withMessage('El identificador no es válido.'), validar];

const reglas = {
  registro: [
    body('nombre').trim().isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres.'),
    body('email').trim().isEmail().withMessage('Escribe un correo válido.').toLowerCase(),
    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.')
      .matches(/[A-Za-z]/).withMessage('La contraseña debe incluir al menos una letra.')
      .matches(/\d/).withMessage('La contraseña debe incluir al menos un número.'),
    validar,
  ],

  login: [
    body('email').trim().isEmail().withMessage('Escribe un correo válido.').toLowerCase(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
    validar,
  ],

  categoria: (parcial = false) => [
    ...(parcial ? [param('id').isMongoId().withMessage('El identificador no es válido.')] : []),
    (parcial ? body('nombre').optional() : body('nombre'))
      .trim().isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres.'),
    body('descripcion').optional().trim().isLength({ max: 200 }).withMessage('La descripción admite máximo 200 caracteres.'),
    validar,
  ],

  producto: (parcial = false) => {
    const campo = (n) => (parcial ? body(n).optional() : body(n));
    return [
      ...(parcial ? [param('id').isMongoId().withMessage('El identificador no es válido.')] : []),
      campo('nombre').trim().isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.'),
      campo('precio').isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0.').toFloat(),
      campo('categoria').isMongoId().withMessage('La categoría no es válida.'),
      body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0.').toInt(),
      body('nivel').optional().isIn(NIVELES).withMessage(`El nivel debe ser: ${NIVELES.join(', ')}.`),
      body('descripcion').optional().trim().isLength({ max: 500 }).withMessage('La descripción admite máximo 500 caracteres.'),
      validar,
    ];
  },

  listarProductos: [
    query('categoria').optional().isMongoId().withMessage('La categoría no es válida.'),
    query('nivel').optional().isIn(NIVELES).withMessage('Nivel no válido.'),
    query('q').optional().trim().isLength({ max: 60 }).withMessage('La búsqueda es demasiado larga.'),
    validar,
  ],
};

module.exports = { validar, idValido, reglas };
