const { Router } = require('express');
const ctrl = require('../controllers/productos.controller');
const { reglas, idValido } = require('../middleware/validar');
const { autenticar, autorizar } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

/* Autenticación: todas las rutas de productos requieren un token válido */
router.use(autenticar);

/* Lectura: cualquier usuario autenticado (admin o cliente) */
router.get('/', reglas.listarProductos, asyncHandler(ctrl.listar));
router.get('/:id', idValido, asyncHandler(ctrl.obtener));

/* Escritura: autorización solo para administradores */
router.post('/', autorizar('admin'), reglas.producto(), asyncHandler(ctrl.crear));
router.put('/:id', autorizar('admin'), reglas.producto(true), asyncHandler(ctrl.actualizar));
router.delete('/:id', autorizar('admin'), idValido, asyncHandler(ctrl.eliminar));

module.exports = router;
