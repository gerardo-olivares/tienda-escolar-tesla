const mongoose = require('mongoose');
const { env } = require('./env');

/**
 * Conexión a MongoDB con Mongoose.
 * En Vercel cada petición puede ejecutarse en una función nueva; por eso la
 * conexión se guarda en una variable global y se reutiliza mientras la
 * función siga "caliente", en lugar de abrir una conexión por petición.
 */
let cache = global.__mongoose;
if (!cache) cache = global.__mongoose = { conexion: null, promesa: null };

async function conectarDB(uri = env.mongoUri) {
  if (cache.conexion && mongoose.connection.readyState === 1) return cache.conexion;

  if (!cache.promesa) {
    cache.promesa = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 })
      .then((m) => {
        console.log('✔ Conectado a MongoDB');
        return m;
      })
      .catch((error) => {
        cache.promesa = null;          // permite reintentar en la siguiente petición
        throw error;
      });
  }
  cache.conexion = await cache.promesa;
  return cache.conexion;
}

async function desconectarDB() {
  await mongoose.disconnect();
  cache.conexion = null;
  cache.promesa = null;
}

module.exports = { conectarDB, desconectarDB };
