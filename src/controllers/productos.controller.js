const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const ApiError = require('../utils/ApiError');

const CAMPOS = ['nombre', 'descripcion', 'precio', 'stock', 'nivel', 'categoria'];
const escaparRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* Solo copia los campos permitidos del cuerpo de la petición */
const tomarCampos = (body) =>
  Object.fromEntries(CAMPOS.filter((c) => body[c] !== undefined).map((c) => [c, body[c]]));

const verificarCategoria = async (id) => {
  if (id && !(await Categoria.exists({ _id: id }))) {
    throw ApiError.badRequest('La categoría indicada no existe.', [{ campo: 'categoria', mensaje: 'La categoría indicada no existe.' }]);
  }
};

/* GET /api/productos?categoria=&nivel=&q= */
const listar = async (req, res) => {
  const { categoria, nivel, q } = req.query;
  const filtro = {};
  if (categoria) filtro.categoria = categoria;
  if (nivel) filtro.nivel = nivel;
  if (q) filtro.nombre = new RegExp(escaparRegex(q), 'i');

  const productos = await Producto.find(filtro).populate('categoria', 'nombre').sort({ createdAt: -1 });
  res.json({ ok: true, total: productos.length, data: productos });
};

/* GET /api/productos/:id */
const obtener = async (req, res) => {
  const producto = await Producto.findById(req.params.id).populate('categoria', 'nombre');
  if (!producto) throw ApiError.notFound('El producto no existe.');
  res.json({ ok: true, data: producto });
};

/* POST /api/productos  (admin) */
const crear = async (req, res) => {
  const datos = tomarCampos(req.body);
  await verificarCategoria(datos.categoria);
  const producto = await Producto.create({ ...datos, creadoPor: req.usuario._id });
  await producto.populate('categoria', 'nombre');
  res.status(201).json({ ok: true, data: producto });
};

/* PUT /api/productos/:id  (admin) */
const actualizar = async (req, res) => {
  const cambios = tomarCampos(req.body);
  if (!Object.keys(cambios).length) throw ApiError.badRequest('No se envió ningún campo para actualizar.');
  await verificarCategoria(cambios.categoria);

  const producto = await Producto.findByIdAndUpdate(req.params.id, cambios, { returnDocument: 'after', runValidators: true })
    .populate('categoria', 'nombre');
  if (!producto) throw ApiError.notFound('El producto no existe.');
  res.json({ ok: true, data: producto });
};

/* DELETE /api/productos/:id  (admin) */
const eliminar = async (req, res) => {
  const producto = await Producto.findByIdAndDelete(req.params.id);
  if (!producto) throw ApiError.notFound('El producto no existe.');
  res.json({ ok: true, data: { id: producto._id }, mensaje: 'Producto eliminado.' });
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
