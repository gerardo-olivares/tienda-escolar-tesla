/* login.js — inicio de sesión y registro */
'use strict';

if (Sesion.token) location.replace('index.html');

const alerta = document.getElementById('alerta');
const mostrarAlerta = (mensaje, tipo = 'error') => {
  alerta.textContent = mensaje;
  alerta.className = `alerta ${tipo}`;
  alerta.hidden = false;
};

const motivo = new URLSearchParams(location.search).get('motivo');
if (motivo === 'expirada') mostrarAlerta('Tu sesión expiró. Vuelve a iniciar sesión.', 'aviso');
if (motivo === 'salida') mostrarAlerta('Cerraste sesión correctamente.', 'exito');

/* Pestañas Iniciar sesión / Crear cuenta */
const tabs = [document.getElementById('tab-login'), document.getElementById('tab-registro')];
const activar = (tab) => {
  tabs.forEach((t) => {
    const activa = t === tab;
    t.classList.toggle('activa', activa);
    t.setAttribute('aria-selected', String(activa));
    t.tabIndex = activa ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !activa;
  });
  alerta.hidden = true;
};
tabs.forEach((t) => t.addEventListener('click', () => activar(t)));

const entrar = ({ data }) => {
  Sesion.guardar(data.token, data.usuario);
  location.replace('index.html');
};

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return mostrarAlerta('Escribe tu correo y tu contraseña.');

  const boton = e.submitter || e.target.querySelector('button[type=submit]');
  botonCargando(boton, true);
  try {
    entrar(await API.login(email, password));
  } catch (error) {
    mostrarAlerta(error.message);
    botonCargando(boton, false);
  }
});

document.getElementById('form-registro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  const boton = e.submitter || e.target.querySelector('button[type=submit]');
  botonCargando(boton, true);
  try {
    entrar(await API.registro(nombre, email, password));
  } catch (error) {
    mostrarAlerta(error.detalles?.length ? error.detalles.map((d) => d.mensaje).join(' ') : error.message);
    botonCargando(boton, false);
  }
});
