/* Punto de entrada para ejecutar el servidor en local:  npm start */
const { env, validarEnv } = require('./config/env');
const app = require('./app');
const { conectarDB } = require('./config/db');
const asegurarAdmin = require('./config/adminInicial');

(async () => {
  try {
    validarEnv();
    await conectarDB();
    await asegurarAdmin();
    app.listen(env.port, () => console.log(`✔ Servidor en http://localhost:${env.port}`));
  } catch (error) {
    console.error('✖ No se pudo iniciar:', error.message);
    process.exit(1);
  }
})();
