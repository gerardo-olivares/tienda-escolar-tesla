/**
 * Datos iniciales:  npm run seed
 * Crea el administrador (ADMIN_* del .env), categorías y productos de ejemplo.
 * Se puede ejecutar varias veces sin duplicar.
 */
const { validarEnv } = require('../config/env');
const { conectarDB, desconectarDB } = require('../config/db');
const asegurarAdmin = require('../config/adminInicial');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

const categorias = [
  { nombre: 'Uniformes', descripcion: 'Uniformes oficiales de diario y deportivos' },
  { nombre: 'Útiles escolares', descripcion: 'Cuadernos, lápices, colores y material de trabajo' },
  { nombre: 'Libros', descripcion: 'Libros de texto y de inglés' },
];

const productos = [
  { nombre: 'Playera tipo polo', descripcion: 'Playera blanca con logo bordado del colegio', precio: 280, stock: 45, nivel: 'general', cat: 'Uniformes' },
  { nombre: 'Pants deportivo', descripcion: 'Conjunto deportivo azul marino para educación física', precio: 520, stock: 30, nivel: 'general', cat: 'Uniformes' },
  { nombre: 'Mandil de preescolar', descripcion: 'Mandil a cuadros para actividades de arte', precio: 190, stock: 25, nivel: 'preescolar', cat: 'Uniformes' },
  { nombre: 'Paquete de útiles de primaria', descripcion: 'Cuadernos, lápices, colores, regla y tijeras', precio: 650, stock: 40, nivel: 'primaria', cat: 'Útiles escolares' },
  { nombre: 'Kit de arte de preescolar', descripcion: 'Crayolas, plastilina, pinceles y acuarelas', precio: 340, stock: 20, nivel: 'preescolar', cat: 'Útiles escolares' },
  { nombre: 'Libro de inglés 3.º de primaria', descripcion: 'Libro y cuaderno de trabajo del programa bilingüe', precio: 890, stock: 15, nivel: 'primaria', cat: 'Libros' },
];

(async () => {
  try {
    validarEnv();
    await conectarDB();
    await asegurarAdmin();
    const admin = await Usuario.findOne({ rol: 'admin' });

    for (const c of categorias) {
      await Categoria.updateOne({ nombre: c.nombre }, { $setOnInsert: c }, { upsert: true });
    }
    if ((await Producto.countDocuments()) === 0) {
      const mapa = Object.fromEntries((await Categoria.find()).map((c) => [c.nombre, c._id]));
      await Producto.insertMany(productos.map(({ cat, ...p }) => ({ ...p, categoria: mapa[cat], creadoPor: admin?._id })));
      console.log(`✔ ${productos.length} productos de ejemplo creados`);
    } else {
      console.log('• Ya existen productos; no se agregaron ejemplos.');
    }
  } catch (error) {
    console.error('✖ Error:', error.message);
    process.exitCode = 1;
  } finally {
    await desconectarDB();
  }
})();
