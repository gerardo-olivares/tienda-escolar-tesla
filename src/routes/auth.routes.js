const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');
const { reglas } = require('../middleware/validar');
const { autenticar } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = Router();

router.post('/registro', reglas.registro, asyncHandler(ctrl.registro));
router.post('/login', reglas.login, asyncHandler(ctrl.login));
router.get('/perfil', autenticar, ctrl.perfil);

module.exports = router;
