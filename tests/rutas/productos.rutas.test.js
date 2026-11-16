/**
 * Pruebas de rutas con supertest: recorren la app completa de Express
 * (middlewares de conexión, autenticación, autorización, validación y errores)
 * con los modelos simulados.
 */
jest.mock('../../src/config/db', () => ({ conectarDB: jest.fn().mockResolvedValue(), desconectarDB: jest.fn() }));
jest.mock('../../src/config/adminInicial', () => jest.fn().mockResolvedValue(null));
jest.mock('../../src/models/Usuario', () => ({ findById: jest.fn(), exists: jest.fn(), ROLES: ['admin', 'cliente'] }));
jest.mock('../../src/models/Categoria', () => ({ exists: jest.fn(), find: jest.fn() }));
jest.mock('../../src/models/Producto', () => ({
  find: jest.fn(), findById: jest.fn(), create: jest.fn(),
  findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn(), countDocuments: jest.fn(),
  NIVELES: ['preescolar', 'primaria', 'general'],
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Usuario = require('../../src/models/Usuario');
const Categoria = require('../../src/models/Categoria');
const Producto = require('../../src/models/Producto');
const { consulta, ID } = require('../helpers');

const tokenDe = (id) => `Bearer ${jwt.sign({ sub: id }, process.env.JWT_SECRET)}`;
const ADMIN = tokenDe(ID.admin);
const CLIENTE = tokenDe(ID.cliente);

beforeEach(() => {
  jest.clearAllMocks();
  Usuario.findById.mockImplementation(async (id) =>
    ({ [ID.admin]: { _id: ID.admin, rol: 'admin' }, [ID.cliente]: { _id: ID.cliente, rol: 'cliente' } }[id] || null));
});

describe('Protección de rutas', () => {
  test('GET /api/productos sin token responde 401', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  test('un cliente puede ver el catálogo (200)', async () => {
    Producto.find.mockReturnValue(consulta([{ nombre: 'Playera' }]));
    const res = await request(app).get('/api/productos').set('Authorization', CLIENTE);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  test('un cliente NO puede crear productos (403)', async () => {
    const res = await request(app).post('/api/productos').set('Authorization', CLIENTE)
      .send({ nombre: 'Gorra', precio: 150, categoria: ID.categoria });
    expect(res.status).toBe(403);
    expect(Producto.create).not.toHaveBeenCalled();
  });

  test('un cliente NO puede eliminar productos (403)', async () => {
    const res = await request(app).delete(`/api/productos/${ID.producto}`).set('Authorization', CLIENTE);
    expect(res.status).toBe(403);
  });
});

describe('CRUD como administrador', () => {
  test('POST crea un producto (201)', async () => {
    Categoria.exists.mockResolvedValue(true);
    Producto.create.mockResolvedValue({ _id: ID.producto, nombre: 'Gorra', populate: jest.fn().mockResolvedValue() });
    const res = await request(app).post('/api/productos').set('Authorization', ADMIN)
      .send({ nombre: 'Gorra escolar', precio: 150, stock: 10, categoria: ID.categoria });
    expect(res.status).toBe(201);
    expect(Producto.create.mock.calls[0][0]).toMatchObject({ precio: 150, stock: 10, creadoPor: ID.admin });
  });

  test('POST con datos inválidos responde 400 con detalle por campo', async () => {
    const res = await request(app).post('/api/productos').set('Authorization', ADMIN).send({ nombre: 'ab', precio: -5 });
    expect(res.status).toBe(400);
    const campos = res.body.error.detalles.map((d) => d.campo);
    expect(campos).toEqual(expect.arrayContaining(['nombre', 'precio', 'categoria']));
  });

  test('PUT actualiza (200)', async () => {
    Producto.findByIdAndUpdate.mockReturnValue(consulta({ _id: ID.producto, precio: 175 }));
    const res = await request(app).put(`/api/productos/${ID.producto}`).set('Authorization', ADMIN).send({ precio: 175 });
    expect(res.status).toBe(200);
    expect(res.body.data.precio).toBe(175);
  });

  test('DELETE de un producto inexistente responde 404', async () => {
    Producto.findByIdAndDelete.mockResolvedValue(null);
    const res = await request(app).delete(`/api/productos/${ID.producto}`).set('Authorization', ADMIN);
    expect(res.status).toBe(404);
  });

  test('un id con formato inválido responde 400', async () => {
    const res = await request(app).get('/api/productos/123').set('Authorization', ADMIN);
    expect(res.status).toBe(400);
  });
});

describe('Manejo de errores', () => {
  test('una ruta inexistente responde 404 en JSON', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.mensaje).toMatch(/no existe/);
  });

  test('un JSON mal formado responde 400', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{ "email": ');
    expect(res.status).toBe(400);
  });

  test('si la base de datos falla responde 503', async () => {
    const db = require('../../src/config/db');
    const silenciar = jest.spyOn(console, 'error').mockImplementation(() => {});   // el error es esperado
    db.conectarDB.mockRejectedValueOnce(new Error('timeout'));
    const res = await request(app).get('/api/productos').set('Authorization', ADMIN);
    expect(res.status).toBe(503);
    expect(silenciar).toHaveBeenCalled();                  // el error sí se registra en el servidor
    silenciar.mockRestore();
  });
});
