const Usuario = require('../models/Usuario');
const { env } = require('./env');

/**
 * Si no existe ningún administrador, lo crea con ADMIN_EMAIL y ADMIN_PASSWORD.
 * Así el primer despliegue ya tiene con quién iniciar sesión.
 */
async function asegurarAdmin() {
  if (!env.admin.email || !env.admin.password) return null;
  if (await Usuario.exists({ rol: 'admin' })) return null;

  const admin = await Usuario.create({
    nombre: env.admin.nombre,
    email: env.admin.email,
    password: env.admin.password,
    rol: 'admin',
  });
  console.log(`✔ Administrador inicial creado: ${admin.email}`);
  return admin;
}

module.exports = asegurarAdmin;
