/**
 * Utilidades para las pruebas.
 * Los modelos de Mongoose se reemplazan por funciones simuladas (jest.fn),
 * así las pruebas no necesitan una base de datos real y corren en segundos,
 * también en GitHub Actions.
 */

/* Simula una consulta encadenable de Mongoose: Model.find().populate().sort() */
const consulta = (resultado) => {
  const q = {
    populate: jest.fn(() => q),
    sort: jest.fn(() => q),
    select: jest.fn(() => q),
    then: (ok, error) => Promise.resolve(resultado).then(ok, error),
  };
  return q;
};

/* Objeto res de Express simulado */
const respuestaSimulada = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const ID = {
  admin: '6a0000000000000000000001',
  cliente: '6a0000000000000000000002',
  categoria: '6a00000000000000000000c1',
  producto: '6a00000000000000000000p1'.replace('p', 'a'),
};

module.exports = { consulta, respuestaSimulada, ID };
