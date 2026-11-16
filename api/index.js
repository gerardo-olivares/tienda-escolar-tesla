/**
 * Punto de entrada para Vercel (función serverless).
 * Vercel ejecuta este archivo y le pasa cada petición a la app de Express.
 */
const app = require('../src/app');

module.exports = app;
