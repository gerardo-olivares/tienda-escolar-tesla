const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const ApiError = require('../utils/ApiError');
const { env } = require('../config/env');

const generarToken = (usuario) =>
  jwt.sign({ sub: String(usuario._id), rol: usuario.rol, nombre: usuario.nombre }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

/* POST /api/auth/registro — crea una cuenta con rol "cliente" */
const registro = async (req, res) => {
  const { nombre, email, password } = req.body;

  if (await Usuario.exists({ email })) {
    throw ApiError.conflict('Ya existe una cuenta con ese correo.');
  }
  // El rol nunca se toma del cuerpo de la petición: nadie puede registrarse como admin
  const usuario = await Usuario.create({ nombre, email, password, rol: 'cliente' });

  res.status(201).json({ ok: true, data: { token: generarToken(usuario), usuario } });
};

/* POST /api/auth/login — valida credenciales y devuelve el token */
const login = async (req, res) => {
  const { email, password } = req.body;
  const usuario = await Usuario.findOne({ email }).select('+password');

  if (!usuario || !(await usuario.compararPassword(password))) {
    throw ApiError.unauthorized('Correo o contraseña incorrectos.');
  }

  res.json({ ok: true, data: { token: generarToken(usuario), usuario } });
};

/* GET /api/auth/perfil — datos del usuario autenticado */
const perfil = (req, res) => {
  res.json({ ok: true, data: { usuario: req.usuario } });
};

module.exports = { registro, login, perfil, generarToken };
