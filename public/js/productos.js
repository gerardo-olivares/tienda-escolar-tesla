/* productos.js — catálogo (todos) y administración (solo admin) */
'use strict';

const $ = (id) => document.getElementById(id);
const estado = { productos: [], categorias: [], esAdmin: false, editando: null };
const NIVELES = { preescolar: 'Preescolar', primaria: 'Primaria', general: 'General' };
const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

const toast = (mensaje, tipo = 'exito') => {
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.textContent = mensaje;
  $('toasts').append(el);
  setTimeout(() => el.remove(), 3500);
};

/* ---------- Usuario ---------- */
const mostrarUsuario = (u) => {
  $('usuario-nombre').textContent = u.nombre;
  $('usuario-rol').textContent = u.rol === 'admin' ? 'Administrador' : 'Cliente';
  $('avatar').textContent = u.nombre.trim().charAt(0).toUpperCase();
  estado.esAdmin = u.rol === 'admin';
  document.querySelectorAll('.solo-admin').forEach((el) => { el.hidden = !estado.esAdmin; });
};
$('btn-salir').addEventListener('click', () => Sesion.cerrar('salida'));

/* ---------- Productos ---------- */
const plantilla = (p) => `
  <li class="producto" data-id="${p._id}">
    <div class="producto-cabecera">
      <span class="etiqueta">${escaparHTML(p.categoria?.nombre || 'Sin categoría')}</span>
      <span class="nivel nivel-${p.nivel}">${NIVELES[p.nivel]}</span>
    </div>
    <h3>${escaparHTML(p.nombre)}</h3>
    <p class="descripcion">${escaparHTML(p.descripcion || '')}</p>
    <div class="producto-pie">
      <span class="precio">${moneda.format(p.precio)}</span>
      <span class="stock ${p.stock === 0 ? 'agotado' : p.stock < 10 ? 'bajo' : ''}">${p.stock === 0 ? 'Agotado' : `${p.stock} disponibles`}</span>
    </div>
    ${estado.esAdmin ? `
    <div class="producto-acciones">
      <button type="button" class="btn-icono" data-accion="editar" aria-label="Editar ${escaparHTML(p.nombre)}">Editar</button>
      <button type="button" class="btn-icono peligro" data-accion="eliminar" aria-label="Eliminar ${escaparHTML(p.nombre)}">Eliminar</button>
    </div>` : ''}
  </li>`;

const cargarProductos = async () => {
  try {
    const { data, total } = await API.productos({ q: $('buscar').value.trim(), categoria: $('filtro-categoria').value, nivel: $('filtro-nivel').value });
    estado.productos = data;
    $('lista').innerHTML = data.map(plantilla).join('');
    $('vacio').hidden = data.length > 0;
    $('contador').textContent = `${total} producto${total === 1 ? '' : 's'}`;
  } catch (error) {
    toast(error.message, 'error');
  }
};

let tBusqueda;
$('buscar').addEventListener('input', () => { clearTimeout(tBusqueda); tBusqueda = setTimeout(cargarProductos, 300); });
$('filtro-categoria').addEventListener('change', cargarProductos);
$('filtro-nivel').addEventListener('change', cargarProductos);

/* ---------- Categorías ---------- */
const cargarCategorias = async () => {
  const { data } = await API.categorias();
  estado.categorias = data;
  const opciones = data.map((c) => `<option value="${c._id}">${escaparHTML(c.nombre)}</option>`).join('');
  const actual = $('filtro-categoria').value;
  $('filtro-categoria').innerHTML = `<option value="">Todas las categorías</option>${opciones}`;
  $('filtro-categoria').value = actual;
  $('p-categoria').innerHTML = opciones;
  $('lista-categorias').innerHTML = data.map((c) => `
    <li class="chip" data-id="${c._id}">${escaparHTML(c.nombre)}
      <button type="button" class="chip-x" aria-label="Eliminar categoría ${escaparHTML(c.nombre)}">×</button></li>`).join('');
};

$('form-categoria').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = $('cat-nombre').value.trim();
  if (nombre.length < 2) return toast('El nombre de la categoría debe tener al menos 2 caracteres.', 'error');
  try {
    await API.crearCategoria(nombre);
    $('cat-nombre').value = '';
    toast('Categoría agregada.');
    await cargarCategorias();
  } catch (error) { toast(error.message, 'error'); }
});

$('lista-categorias').addEventListener('click', async (e) => {
  if (!e.target.classList.contains('chip-x')) return;
  const { id } = e.target.closest('.chip').dataset;
  try {
    await API.eliminarCategoria(id);
    toast('Categoría eliminada.');
    await cargarCategorias();
  } catch (error) { toast(error.message, 'error'); }   // 409 si tiene productos
});

/* ---------- Crear / editar producto ---------- */
const dialogo = $('dialogo-producto');
const limpiarErrores = () => dialogo.querySelectorAll('[data-error]').forEach((p) => { p.textContent = ''; });

const abrirFormulario = (producto = null) => {
  estado.editando = producto?._id || null;
  $('titulo-dialogo').textContent = producto ? 'Editar producto' : 'Nuevo producto';
  $('p-nombre').value = producto?.nombre || '';
  $('p-descripcion').value = producto?.descripcion || '';
  $('p-precio').value = producto?.precio ?? '';
  $('p-stock').value = producto?.stock ?? 0;
  $('p-nivel').value = producto?.nivel || 'general';
  $('p-categoria').value = producto?.categoria?._id || estado.categorias[0]?._id || '';
  limpiarErrores();
  dialogo.showModal();
  $('p-nombre').focus();
};

/* Al corregir un campo se borra su mensaje de error */
['nombre', 'precio', 'stock', 'categoria'].forEach((campo) => {
  $(`p-${campo}`).addEventListener('input', () => {
    dialogo.querySelector(`[data-error="${campo}"]`).textContent = '';
  });
});

$('btn-nuevo').addEventListener('click', () => abrirFormulario());
$('btn-cancelar').addEventListener('click', () => dialogo.close());

$('form-producto').addEventListener('submit', async (e) => {
  e.preventDefault();
  limpiarErrores();
  const datos = {
    nombre: $('p-nombre').value.trim(),
    descripcion: $('p-descripcion').value.trim(),
    precio: $('p-precio').value === '' ? undefined : Number($('p-precio').value),
    stock: Number($('p-stock').value || 0),
    nivel: $('p-nivel').value,
    categoria: $('p-categoria').value,
  };
  const boton = $('btn-guardar');
  botonCargando(boton, true);
  try {
    if (estado.editando) {
      await API.actualizarProducto(estado.editando, datos);
      toast('Producto actualizado.');
    } else {
      await API.crearProducto(datos);
      toast('Producto creado.');
    }
    dialogo.close();
    await cargarProductos();
  } catch (error) {
    (error.detalles || []).forEach(({ campo, mensaje }) => {
      const p = dialogo.querySelector(`[data-error="${campo}"]`);
      if (p) p.textContent = mensaje;
    });
    toast(error.message, 'error');
  } finally {
    botonCargando(boton, false);
  }
});

/* ---------- Editar / eliminar desde la tarjeta ---------- */
$('lista').addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton) return;
  const { id } = boton.closest('.producto').dataset;
  const producto = estado.productos.find((p) => p._id === id);
  if (boton.dataset.accion === 'editar') return abrirFormulario(producto);
  if (boton.dataset.accion === 'eliminar') {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"?`)) return;
    try {
      await API.eliminarProducto(id);
      toast('Producto eliminado.');
      await cargarProductos();
    } catch (error) { toast(error.message, 'error'); }
  }
});

/* ---------- Inicio ---------- */
(async () => {
  if (Sesion.usuario) mostrarUsuario(Sesion.usuario);
  try {
    const { data } = await API.perfil();       // valida el token en el servidor
    mostrarUsuario(data.usuario);
    await cargarCategorias();
    await cargarProductos();
  } catch (error) {
    if (error.status !== 401) toast(error.message, 'error');
  }
})();
