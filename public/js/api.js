/* api.js — cliente de la API: fetch + token JWT + manejo de errores */
'use strict';

const Sesion = {
  get token() { try { return localStorage.getItem('tienda_token'); } catch { return null; } },
  get usuario() { try { return JSON.parse(localStorage.getItem('tienda_usuario')); } catch { return null; } },
  guardar(token, usuario) {
    try {
      localStorage.setItem('tienda_token', token);
      localStorage.setItem('tienda_usuario', JSON.stringify(usuario));
    } catch { /* almacenamiento no disponible */ }
  },
  cerrar(motivo = '') {
    try { localStorage.removeItem('tienda_token'); localStorage.removeItem('tienda_usuario'); } catch { /* */ }
    location.replace(`login.html${motivo ? `?motivo=${motivo}` : ''}`);
  },
};

class ErrorApi extends Error {
  constructor(status, mensaje, detalles = []) { super(mensaje); this.status = status; this.detalles = detalles; }
}

const peticion = async (ruta, { method = 'GET', body, auth = true } = {}) => {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && Sesion.token) headers.Authorization = `Bearer ${Sesion.token}`;

  let r;
  try {
    r = await fetch(`/api${ruta}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor.');
  }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    const { mensaje = 'Ocurrió un error inesperado.', detalles = [] } = datos.error || {};
    if (r.status === 401 && auth && Sesion.token) Sesion.cerrar('expirada');
    throw new ErrorApi(r.status, mensaje, detalles);
  }
  return datos;
};

const API = {
  login: (email, password) => peticion('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  registro: (nombre, email, password) => peticion('/auth/registro', { method: 'POST', body: { nombre, email, password }, auth: false }),
  perfil: () => peticion('/auth/perfil'),
  productos: (filtros = {}) => peticion(`/productos?${new URLSearchParams(Object.entries(filtros).filter(([, v]) => v))}`),
  crearProducto: (p) => peticion('/productos', { method: 'POST', body: p }),
  actualizarProducto: (id, p) => peticion(`/productos/${id}`, { method: 'PUT', body: p }),
  eliminarProducto: (id) => peticion(`/productos/${id}`, { method: 'DELETE' }),
  categorias: () => peticion('/categorias'),
  crearCategoria: (nombre) => peticion('/categorias', { method: 'POST', body: { nombre } }),
  eliminarCategoria: (id) => peticion(`/categorias/${id}`, { method: 'DELETE' }),
};

const escaparHTML = (t = '') =>
  String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const botonCargando = (boton, cargando) => {
  boton.disabled = cargando;
  boton.classList.toggle('cargando', cargando);
};
