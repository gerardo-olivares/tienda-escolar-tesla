/* Pruebas unitarias del controlador de productos (modelos simulados) */
jest.mock('../../src/models/Producto', () => ({
  find: jest.fn(), findById: jest.fn(), create: jest.fn(),
  findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn(),
  NIVELES: ['preescolar', 'primaria', 'general'],
}));
jest.mock('../../src/models/Categoria', () => ({ exists: jest.fn() }));

const Producto = require('../../src/models/Producto');
const Categoria = require('../../src/models/Categoria');
const ctrl = require('../../src/controllers/productos.controller');
const { consulta, respuestaSimulada, ID } = require('../helpers');

const playera = { _id: ID.producto, nombre: 'Playera tipo polo', precio: 280, stock: 45, nivel: 'general', categoria: { _id: ID.categoria, nombre: 'Uniformes' } };

beforeEach(() => jest.clearAllMocks());

describe('listar', () => {
  test('devuelve todos los productos con el total', async () => {
    Producto.find.mockReturnValue(consulta([playera]));
    const res = respuestaSimulada();

    await ctrl.listar({ query: {} }, res);

    expect(Producto.find).toHaveBeenCalledWith({});
    expect(res.json).toHaveBeenCalledWith({ ok: true, total: 1, data: [playera] });
  });

  test('aplica los filtros de categoría, nivel y búsqueda', async () => {
    Producto.find.mockReturnValue(consulta([]));
    await ctrl.listar({ query: { categoria: ID.categoria, nivel: 'primaria', q: 'libro' } }, respuestaSimulada());

    const filtro = Producto.find.mock.calls[0][0];
    expect(filtro.categoria).toBe(ID.categoria);
    expect(filtro.nivel).toBe('primaria');
    expect(filtro.nombre).toEqual(/libro/i);
  });

  test('escapa caracteres especiales en la búsqueda', async () => {
    Producto.find.mockReturnValue(consulta([]));
    await ctrl.listar({ query: { q: 'a.*b' } }, respuestaSimulada());
    expect(Producto.find.mock.calls[0][0].nombre.source).toBe('a\\.\\*b');
  });
});

describe('obtener', () => {
  test('devuelve el producto si existe', async () => {
    Producto.findById.mockReturnValue(consulta(playera));
    const res = respuestaSimulada();
    await ctrl.obtener({ params: { id: ID.producto } }, res);
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: playera });
  });

  test('lanza 404 si no existe', async () => {
    Producto.findById.mockReturnValue(consulta(null));
    await expect(ctrl.obtener({ params: { id: ID.producto } }, respuestaSimulada()))
      .rejects.toMatchObject({ status: 404, message: 'El producto no existe.' });
  });
});

describe('crear', () => {
  const req = (body) => ({ body, usuario: { _id: ID.admin } });

  test('crea el producto, guarda quién lo creó y responde 201', async () => {
    Categoria.exists.mockResolvedValue(true);
    const creado = { ...playera, populate: jest.fn().mockResolvedValue() };
    Producto.create.mockResolvedValue(creado);
    const res = respuestaSimulada();

    await ctrl.crear(req({ nombre: 'Playera tipo polo', precio: 280, categoria: ID.categoria }), res);

    expect(Producto.create).toHaveBeenCalledWith({ nombre: 'Playera tipo polo', precio: 280, categoria: ID.categoria, creadoPor: ID.admin });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('ignora campos no permitidos (por ejemplo creadoPor enviado por el cliente)', async () => {
    Categoria.exists.mockResolvedValue(true);
    Producto.create.mockResolvedValue({ populate: jest.fn().mockResolvedValue() });
    await ctrl.crear(req({ nombre: 'Gorra', precio: 150, categoria: ID.categoria, creadoPor: 'otro', _id: 'x' }), respuestaSimulada());
    expect(Producto.create.mock.calls[0][0]).toEqual({ nombre: 'Gorra', precio: 150, categoria: ID.categoria, creadoPor: ID.admin });
  });

  test('rechaza una categoría que no existe con 400', async () => {
    Categoria.exists.mockResolvedValue(null);
    await expect(ctrl.crear(req({ nombre: 'Gorra', precio: 150, categoria: ID.categoria }), respuestaSimulada()))
      .rejects.toMatchObject({ status: 400 });
    expect(Producto.create).not.toHaveBeenCalled();
  });
});

describe('actualizar', () => {
  test('actualiza solo los campos enviados', async () => {
    Producto.findByIdAndUpdate.mockReturnValue(consulta({ ...playera, precio: 300 }));
    const res = respuestaSimulada();
    await ctrl.actualizar({ params: { id: ID.producto }, body: { precio: 300 } }, res);

    expect(Producto.findByIdAndUpdate).toHaveBeenCalledWith(ID.producto, { precio: 300 }, expect.objectContaining({ runValidators: true }));
    expect(res.json.mock.calls[0][0].data.precio).toBe(300);
  });

  test('lanza 400 si no se envía ningún campo', async () => {
    await expect(ctrl.actualizar({ params: { id: ID.producto }, body: {} }, respuestaSimulada()))
      .rejects.toMatchObject({ status: 400 });
  });

  test('lanza 404 si el producto no existe', async () => {
    Producto.findByIdAndUpdate.mockReturnValue(consulta(null));
    await expect(ctrl.actualizar({ params: { id: ID.producto }, body: { stock: 5 } }, respuestaSimulada()))
      .rejects.toMatchObject({ status: 404 });
  });
});

describe('eliminar', () => {
  test('elimina y confirma', async () => {
    Producto.findByIdAndDelete.mockResolvedValue(playera);
    const res = respuestaSimulada();
    await ctrl.eliminar({ params: { id: ID.producto } }, res);
    expect(res.json).toHaveBeenCalledWith({ ok: true, data: { id: ID.producto }, mensaje: 'Producto eliminado.' });
  });

  test('lanza 404 si no existe', async () => {
    Producto.findByIdAndDelete.mockResolvedValue(null);
    await expect(ctrl.eliminar({ params: { id: ID.producto } }, respuestaSimulada())).rejects.toMatchObject({ status: 404 });
  });
});
