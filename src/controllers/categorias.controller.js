const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const ApiError = require('../utils/ApiError');

/* GET /api/categorias */
const listar = async (_req, res) => {
  const categorias = await Categoria.find().sort({ nombre: 1 });
  res.json({ ok: true, data: categorias });
};

/* POST /api/categorias  (admin) */
const crear = async (req, res) => {
  const { nombre, descripcion } = req.body;
  const categoria = await Categoria.create({ nombre, descripcion });
  res.status(201).json({ ok: true, data: categoria });
};

/* PUT /api/categorias/:id  (admin) */
const actualizar = async (req, res) => {
  const { nombre, descripcion } = req.body;
  const cambios = Object.fromEntries(Object.entries({ nombre, descripcion }).filter(([, v]) => v !== undefined));
  if (!Object.keys(cambios).length) throw ApiError.badRequest('No se envió ningún campo para actualizar.');

  const categoria = await Categoria.findByIdAndUpdate(req.params.id, cambios, { returnDocument: 'after', runValidators: true });
  if (!categoria) throw ApiError.notFound('La categoría no existe.');
  res.json({ ok: true, data: categoria });
};

/* DELETE /api/categorias/:id  (admin) — no se puede borrar si tiene productos */
const eliminar = async (req, res) => {
  const enUso = await Producto.countDocuments({ categoria: req.params.id });
  if (enUso > 0) {
    throw ApiError.conflict(`No se puede eliminar: la categoría tiene ${enUso} producto(s).`);
  }
  const categoria = await Categoria.findByIdAndDelete(req.params.id);
  if (!categoria) throw ApiError.notFound('La categoría no existe.');
  res.json({ ok: true, data: { id: categoria._id }, mensaje: 'Categoría eliminada.' });
};

module.exports = { listar, crear, actualizar, eliminar };
