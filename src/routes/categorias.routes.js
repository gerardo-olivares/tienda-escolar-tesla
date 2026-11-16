const { Router } = require('express');
const ctrl = require('../controllers/categorias.controller');
const { reglas, idValido } = require('../middleware/validar');
const { autenticar, autorizar } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.use(autenticar);                                   // todas requieren sesión

router.get('/', asyncHandler(ctrl.listar));               // cualquier usuario autenticado
router.post('/', autorizar('admin'), reglas.categoria(), asyncHandler(ctrl.crear));
router.put('/:id', autorizar('admin'), reglas.categoria(true), asyncHandler(ctrl.actualizar));
router.delete('/:id', autorizar('admin'), idValido, asyncHandler(ctrl.eliminar));

module.exports = router;
