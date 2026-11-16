/* Pruebas unitarias del controlador de categorías */
jest.mock('../../src/models/Categoria', () => ({
  find: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn(),
}));
jest.mock('../../src/models/Producto', () => ({ countDocuments: jest.fn(), NIVELES: [] }));

const Categoria = require('../../src/models/Categoria');
const Producto = require('../../src/models/Producto');
const ctrl = require('../../src/controllers/categorias.controller');
const { consulta, respuestaSimulada, ID } = require('../helpers');

beforeEach(() => jest.clearAllMocks());

test('listar devuelve las categorías ordenadas', async () => {
  const q = consulta([{ nombre: 'Libros' }, { nombre: 'Uniformes' }]);
  Categoria.find.mockReturnValue(q);
  const res = respuestaSimulada();
  await ctrl.listar({}, res);
  expect(q.sort).toHaveBeenCalledWith({ nombre: 1 });
  expect(res.json.mock.calls[0][0].data).toHaveLength(2);
});

test('crear responde 201', async () => {
  Categoria.create.mockResolvedValue({ _id: ID.categoria, nombre: 'Deportes' });
  const res = respuestaSimulada();
  await ctrl.crear({ body: { nombre: 'Deportes' } }, res);
  expect(res.status).toHaveBeenCalledWith(201);
});

test('no permite eliminar una categoría que tiene productos (409)', async () => {
  Producto.countDocuments.mockResolvedValue(3);
  await expect(ctrl.eliminar({ params: { id: ID.categoria } }, respuestaSimulada()))
    .rejects.toMatchObject({ status: 409 });
  expect(Categoria.findByIdAndDelete).not.toHaveBeenCalled();
});

test('elimina una categoría sin productos', async () => {
  Producto.countDocuments.mockResolvedValue(0);
  Categoria.findByIdAndDelete.mockResolvedValue({ _id: ID.categoria });
  const res = respuestaSimulada();
  await ctrl.eliminar({ params: { id: ID.categoria } }, res);
  expect(res.json.mock.calls[0][0].ok).toBe(true);
});

test('actualizar sin campos responde 400', async () => {
  await expect(ctrl.actualizar({ params: { id: ID.categoria }, body: {} }, respuestaSimulada()))
    .rejects.toMatchObject({ status: 400 });
});
