const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { validarEnv } = require('./config/env');
const { conectarDB } = require('./config/db');
const asegurarAdmin = require('./config/adminInicial');
const { noEncontrado, manejadorErrores } = require('./middleware/errores');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '20kb' }));

/* Registro de peticiones en consola (fuera de las pruebas) */
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', (req, res, next) => {
    const inicio = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - inicio} ms)`));
    next();
  });
}

/* Middleware de conexión a MongoDB: garantiza la conexión antes de cada petición
   a la API (necesario en Vercel, donde las funciones arrancan bajo demanda). */
let adminRevisado = false;
const conexionDB = async (_req, _res, next) => {
  try {
    validarEnv();
  } catch (error) {
    error.status = 500;
    return next(error);                    // mensaje claro si falta MONGODB_URI o JWT_SECRET
  }
  try {
    await conectarDB();
    if (!adminRevisado) {
      adminRevisado = true;
      await asegurarAdmin();
    }
    next();
  } catch (error) {
    error.status = 503;
    error.message = 'No se pudo conectar a la base de datos.';
    next(error);
  }
};

/* Estado del servicio */
app.get('/api/health', conexionDB, (_req, res) => {
  res.json({
    ok: true,
    servicio: 'API Tienda Escolar Colegio Tesla',
    baseDeDatos: mongoose.connection.readyState === 1 ? 'conectada' : 'desconectada',
    entorno: process.env.VERCEL ? 'vercel' : 'local',
  });
});

/* Rutas de recursos */
app.use('/api/auth', conexionDB, require('./routes/auth.routes'));
app.use('/api/categorias', conexionDB, require('./routes/categorias.routes'));
app.use('/api/productos', conexionDB, require('./routes/productos.routes'));

/* Vista estática (login y panel). En Vercel la sirve directamente la CDN. */
app.use(express.static(path.join(__dirname, '..', 'public')));

/* Errores */
app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;
