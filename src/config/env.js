/**
 * Variables de entorno (dotenv).
 * Las credenciales nunca se escriben en el código: se leen de .env en local
 * y del panel de variables de entorno de Vercel en producción.
 */
require('dotenv').config({ quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  admin: {
    nombre: process.env.ADMIN_NOMBRE || 'Administración Tienda Tesla',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};

/* Se llama al iniciar: falla con un mensaje claro si falta algo obligatorio */
const validarEnv = () => {
  const faltantes = [];
  if (!env.mongoUri) faltantes.push('MONGODB_URI');
  if (!env.jwtSecret) faltantes.push('JWT_SECRET');
  if (faltantes.length) {
    throw new Error(`Faltan variables de entorno: ${faltantes.join(', ')}. Copia .env.example como .env y complétalo.`);
  }
  if (env.nodeEnv === 'production' && env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');
  }
};

module.exports = { env, validarEnv };
