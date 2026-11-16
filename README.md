# Tienda Escolar · Colegio Tesla

Aplicación para consultar y administrar los productos de la tienda escolar del Colegio Tesla
(uniformes, útiles y libros). Backend en **Node.js + Express** con **MongoDB (Mongoose)**,
autenticación con **JWT**, vista estática de inicio de sesión, pruebas con **Jest** y despliegue
automático en **Vercel** mediante **GitHub Actions**.

> Actividad 4 — Desarrollo Full Stack, Universidad Tecmilenio. Autor: Gerardo Olivares Mijares.

## Tecnologías

| Capa            | Herramienta                                              |
|-----------------|----------------------------------------------------------|
| Servidor        | Node.js 22, Express 5                                    |
| Base de datos   | MongoDB Atlas + Mongoose                                 |
| Seguridad       | jsonwebtoken (JWT), bcryptjs, express-validator, dotenv  |
| Vista           | HTML, CSS y JavaScript (carpeta `public/`)               |
| Pruebas         | Jest + supertest                                         |
| Despliegue      | Vercel (función serverless + archivos estáticos)         |
| CI/CD           | GitHub Actions                                           |

## Estructura

```
tienda-escolar-tesla/
├── api/index.js                 # entrada de la función serverless en Vercel
├── src/
│   ├── app.js                   # app de Express: middlewares, rutas y errores
│   ├── server.js                # entrada para ejecutar en local (npm start)
│   ├── config/                  # env.js (dotenv), db.js (Mongoose), adminInicial.js
│   ├── models/                  # Usuario, Categoria, Producto
│   ├── controllers/             # auth, categorías, productos
│   ├── routes/                  # rutas de cada recurso
│   ├── middleware/              # auth.js (JWT y roles), validar.js, errores.js
│   ├── utils/                   # ApiError, asyncHandler
│   └── scripts/seed.js          # datos de ejemplo
├── public/                      # vista estática: login.html, index.html, css, js
├── tests/                       # pruebas unitarias y de rutas (Jest)
├── .github/workflows/ci-cd.yml  # pipeline de CI/CD
├── vercel.json                  # configuración de Vercel
└── .env.example                 # plantilla de variables de entorno
```

## Ejecutar en local

Requisitos: Node.js 20 o superior y una base de datos MongoDB (Atlas o local).

```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env
# edita .env con tu MONGODB_URI, JWT_SECRET y los datos ADMIN_*
npm run seed                # crea el administrador, categorías y productos de ejemplo
npm run dev                 # http://localhost:3000
```

| Script                  | Descripción                                   |
|-------------------------|-----------------------------------------------|
| `npm start`             | Inicia el servidor                            |
| `npm run dev`           | Inicia con recarga automática (nodemon)       |
| `npm run seed`          | Carga datos de ejemplo                        |
| `npm test`              | Ejecuta las pruebas con Jest                  |
| `npm run test:coverage` | Pruebas con reporte de cobertura              |

## Roles

- **admin**: ve el catálogo y puede crear, editar y eliminar productos y categorías.
- **cliente**: cualquier persona que se registra; solo puede consultar el catálogo.

El primer administrador se crea automáticamente con `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
Nadie puede registrarse como administrador desde la API.

## Endpoints

Todas las rutas de categorías y productos requieren `Authorization: Bearer <token>`.

| Método | Ruta                   | Acceso        | Descripción                               |
|--------|------------------------|---------------|-------------------------------------------|
| POST   | `/api/auth/registro`   | Público       | Crea una cuenta de cliente                |
| POST   | `/api/auth/login`      | Público       | Inicia sesión y devuelve el token         |
| GET    | `/api/auth/perfil`     | Autenticado   | Datos del usuario de la sesión            |
| GET    | `/api/productos`       | Autenticado   | Lista productos (`?q=`, `?categoria=`, `?nivel=`) |
| GET    | `/api/productos/:id`   | Autenticado   | Detalle de un producto                    |
| POST   | `/api/productos`       | Admin         | Crea un producto                          |
| PUT    | `/api/productos/:id`   | Admin         | Actualiza un producto                     |
| DELETE | `/api/productos/:id`   | Admin         | Elimina un producto                       |
| GET    | `/api/categorias`      | Autenticado   | Lista categorías                          |
| POST   | `/api/categorias`      | Admin         | Crea una categoría                        |
| PUT    | `/api/categorias/:id`  | Admin         | Actualiza una categoría                   |
| DELETE | `/api/categorias/:id`  | Admin         | Elimina una categoría (si no tiene productos) |
| GET    | `/api/health`          | Público       | Estado del servicio y de la base de datos |

Códigos: 200, 201, 400 (datos inválidos), 401 (sin sesión), 403 (sin permiso),
404, 409 (duplicado o categoría en uso), 503 (base de datos no disponible).

## Despliegue en Vercel con GitHub Actions

1. **MongoDB Atlas:** crea un clúster, un usuario y permite el acceso desde `0.0.0.0/0`.
2. **Vercel:** importa el repositorio (*Add New → Project*) y en *Settings → Environment Variables*
   agrega `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
3. **Token y IDs:** crea un token en *Account Settings → Tokens*. El *Project ID* está en
   *Project Settings → General*, y el ID de la cuenta en *Account Settings → General*
   (o en *Team Settings → General* si usas un equipo).
4. **GitHub:** en *Settings → Secrets and variables → Actions* agrega `VERCEL_TOKEN`,
   `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`.
5. Cada `git push` a `main` ejecuta las pruebas y, si pasan, despliega a producción.

`vercel.json` desactiva los despliegues automáticos de Vercel por Git, para que el único camino a
producción sea el pipeline (primero pruebas, después despliegue).
