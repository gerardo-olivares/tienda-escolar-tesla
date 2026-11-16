/* Pruebas unitarias de autenticación: controlador y middlewares */
jest.mock('../../src/models/Usuario', () => ({
  exists: jest.fn(), create: jest.fn(), findOne: jest.fn(), findById: jest.fn(),
  ROLES: ['admin', 'cliente'],
}));

const jwt = require('jsonwebtoken');
const Usuario = require('../../src/models/Usuario');
const ctrl = require('../../src/controllers/auth.controller');
const { autenticar, autorizar } = require('../../src/middleware/auth');
const { consulta, respuestaSimulada, ID } = require('../helpers');

const SECRETO = process.env.JWT_SECRET;
beforeEach(() => jest.clearAllMocks());

describe('registro', () => {
  test('crea la cuenta SIEMPRE con rol cliente, aunque se envíe rol admin', async () => {
    Usuario.exists.mockResolvedValue(null);
    Usuario.create.mockImplementation(async (d) => ({ _id: ID.cliente, ...d }));
    const res = respuestaSimulada();

    await ctrl.registro({ body: { nombre: 'Laura', email: 'laura@correo.com', password: 'Laura2026', rol: 'admin' } }, res);

    expect(Usuario.create).toHaveBeenCalledWith(expect.objectContaining({ rol: 'cliente' }));
    expect(res.status).toHaveBeenCalledWith(201);
    const { token } = res.json.mock.calls[0][0].data;
    expect(jwt.verify(token, SECRETO)).toMatchObject({ sub: ID.cliente, rol: 'cliente' });
  });

  test('responde 409 si el correo ya existe', async () => {
    Usuario.exists.mockResolvedValue({ _id: ID.cliente });
    await expect(ctrl.registro({ body: { nombre: 'L', email: 'laura@correo.com', password: 'x' } }, respuestaSimulada()))
      .rejects.toMatchObject({ status: 409 });
  });
});

describe('login', () => {
  const usuario = { _id: ID.admin, nombre: 'Admin', rol: 'admin', compararPassword: jest.fn() };

  test('con credenciales correctas devuelve un token válido', async () => {
    usuario.compararPassword.mockResolvedValue(true);
    Usuario.findOne.mockReturnValue(consulta(usuario));
    const res = respuestaSimulada();

    await ctrl.login({ body: { email: 'admin@tiendatesla.mx', password: 'Correcta1' } }, res);

    const { token } = res.json.mock.calls[0][0].data;
    expect(jwt.verify(token, SECRETO)).toMatchObject({ sub: ID.admin, rol: 'admin' });
  });

  test('con contraseña incorrecta responde 401', async () => {
    usuario.compararPassword.mockResolvedValue(false);
    Usuario.findOne.mockReturnValue(consulta(usuario));
    await expect(ctrl.login({ body: { email: 'admin@tiendatesla.mx', password: 'mala' } }, respuestaSimulada()))
      .rejects.toMatchObject({ status: 401, message: 'Correo o contraseña incorrectos.' });
  });

  test('con un correo que no existe responde el mismo 401 (no revela si existe)', async () => {
    Usuario.findOne.mockReturnValue(consulta(null));
    await expect(ctrl.login({ body: { email: 'nadie@correo.com', password: 'x' } }, respuestaSimulada()))
      .rejects.toMatchObject({ status: 401, message: 'Correo o contraseña incorrectos.' });
  });
});

describe('middleware autenticar', () => {
  const ejecutar = (headers) => new Promise((resolve) => {
    const req = { headers };
    autenticar(req, {}, (err) => resolve({ err, req }));
  });

  test('sin encabezado Authorization responde 401', async () => {
    const { err } = await ejecutar({});
    expect(err).toMatchObject({ status: 401 });
  });

  test('con un token falso responde 401', async () => {
    const { err } = await ejecutar({ authorization: 'Bearer token.falso.123' });
    expect(err).toMatchObject({ status: 401, message: 'Token inválido.' });
  });

  test('con un token expirado responde 401 con mensaje de sesión expirada', async () => {
    const vencido = jwt.sign({ sub: ID.admin }, SECRETO, { expiresIn: -10 });
    const { err } = await ejecutar({ authorization: `Bearer ${vencido}` });
    expect(err.message).toMatch(/expiró/);
  });

  test('con un token válido agrega el usuario a req.usuario', async () => {
    Usuario.findById.mockResolvedValue({ _id: ID.admin, rol: 'admin' });
    const token = jwt.sign({ sub: ID.admin }, SECRETO);
    const { err, req } = await ejecutar({ authorization: `Bearer ${token}` });
    expect(err).toBeUndefined();
    expect(req.usuario.rol).toBe('admin');
  });
});

describe('middleware autorizar', () => {
  test('permite el paso al rol indicado', () => {
    const next = jest.fn();
    autorizar('admin')({ usuario: { rol: 'admin' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('bloquea con 403 a otros roles', () => {
    const next = jest.fn();
    autorizar('admin')({ usuario: { rol: 'cliente' } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403 });
  });
});
