# Guía de Dockerización y Despliegue Gratuito — Botica Nova Salud

Este documento detalla cómo ejecutar **Botica Nova Salud** utilizando contenedores **Docker** en entorno local y cómo desplegar la aplicación **100% gratis en la nube** aprovechando su arquitectura unificada.

---

## Parte 1: Arquitectura en Docker (`docker-compose.yml`)

El proyecto incluye una configuración multicontenedor en [`docker-compose.yml`](./docker-compose.yml) pensada para entornos empresariales con **Microsoft SQL Server 2022**, **Backend API** y **Frontend**.

### 1. Servicios Definidos en `docker-compose.yml`

| Servicio | Contenedor | Imagen / Build | Puerto Local | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `sqlserver` | `novasalud-sqlserver` | `mcr.microsoft.com/mssql/server:2022-latest` | `1433:1433` | Motor de base de datos relacional con volumen persistente `sqlserver_data` y *healthcheck* automático. |
| `backend` | `novasalud-backend` | `./backend` (`node:18-alpine`) | `8081:8081` | API REST Express. Espera a que `sqlserver` esté saludable (`service_healthy`) antes de iniciar. |
| `frontend` | `novasalud-frontend` | `./frontend` | `3000:80` | Interfaz web SPA conectada al API mediante `VITE_API_URL`. |

### 2. Comandos Esenciales de Docker Compose

- **Construir y levantar todos los servicios en segundo plano:**
  ```bash
  docker compose up -d --build
  ```
- **Ver el estado de los contenedores y sus healthchecks:**
  ```bash
  docker compose ps
  ```
- **Consultar logs en tiempo real (ej. del backend):**
  ```bash
  docker compose logs -f backend
  ```
- **Detener los contenedores conservando los datos de la base de datos:**
  ```bash
  docker compose down
  ```
- **Detener y eliminar volúmenes (reinicio limpio desde cero):**
  ```bash
  docker compose down -v
  ```

---

## Parte 2: Dockerfile Unificado (Recomendado para Nube Gratuita)

Dado que el proyecto cuenta con [`server.ts`](./server.ts) (que sirve tanto la API `/api` como el Frontend compilado en un solo proceso y con motor de base de datos en memoria autogestionado), puedes empaquetar **toda la aplicación Full-Stack en un único contenedor ligero**. Esto evita el alto consumo de RAM de SQL Server (que requiere mínimo 2 GB de RAM) y permite alojar el proyecto en capas gratuitas de 512 MB.

Si deseas usar un `Dockerfile` en la raíz del proyecto para despliegue unificado, crea un archivo llamado `Dockerfile` en la raíz con este contenido:

```dockerfile
# Etapa 1: Construcción del Frontend y dependencias
FROM node:20-alpine AS app
WORKDIR /app

# Copiar manifiestos de dependencias (raíz y backend)
COPY package*.json ./
RUN npm install

# Copiar el código fuente completo
COPY . .

# Compilar el frontend con Vite (genera la carpeta /app/dist)
RUN npm run build

# Exponer el puerto unificado
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Iniciar el servidor Full-Stack (Express + API + Frontend estático)
CMD ["npx", "tsx", "server.ts"]
```

Para probar esta imagen unificada localmente con Docker:
```bash
docker build -t novasalud-fullstack .
docker run -p 3000:3000 -e JWT_SECRET=mi_secreto_seguro_2026 novasalud-fullstack
```

---

## Parte 3: Opciones de Despliegue Gratuito (Free Tier)

A continuación se presentan las **3 mejores alternativas gratuitas** para publicar el proyecto en Internet con HTTPS incluido:

### Opción A: Render.com (La más sencilla — Todo en Uno Gratis)
**Ventaja:** Despliega el Frontend y el Backend juntos desde tu repositorio de GitHub sin necesidad de tarjeta de crédito.

1. Sube este proyecto a un repositorio en **GitHub**.
2. Crea una cuenta gratuita en [Render.com](https://render.com/) y selecciona **New +** -> **Web Service**.
3. Conecta tu repositorio de GitHub.
4. Configura el servicio con estos valores:
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `NODE_ENV=production npx tsx server.ts`
   - **Instance Type:** `Free`
5. En la sección **Environment Variables**, agrega:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `nova_salud_secreto_produccion_2026`
   - `JWT_EXPIRES_IN` = `24h`
6. Haz clic en **Create Web Service**. En 2–3 minutos tendrás una URL pública tipo `https://nova-salud.onrender.com` con el sistema completo funcionando.

> **Nota sobre el plan gratuito de Render:** Las instancias gratuitas entran en reposo tras 15 minutos de inactividad y tardan ~30 segundos en despertar en la primera visita.

---

### Opción B: Koyeb o Fly.io (Despliegue con Docker Gratis)
**Ventaja:** Ideales si prefieres desplegar mediante contenedor Docker directamente.

1. En [Koyeb](https://www.koyeb.com/) (Plan **Hobby Free** sin tarjeta):
   - Crea una nueva **Web App** conectada a tu GitHub.
   - Selecciona **Dockerfile** (usando el `Dockerfile` unificado de la Parte 2) o **Buildpack (Node.js)**.
   - Configura el puerto expuesto en `3000` y las variables `NODE_ENV=production` y `JWT_SECRET`.

---

### Opción C: Arquitectura Separada (Frontend en Vercel + Backend en Render)
Si prefieres separar las capas:
1. **Frontend en [Vercel](https://vercel.com/) o [Netlify](https://www.netlify.com/) (Gratis e instantáneo):**
   - Importa el repositorio, define `npm run build` como comando de compilación y `dist` como directorio de salida (*Output Directory*).
   - Configura la variable de entorno `VITE_API_URL=https://tu-backend.onrender.com/api`.
2. **Backend en Render.com (Gratis):**
   - Crea un Web Service apuntando al directorio raíz `backend` (*Root Directory*: `backend`).
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - Puerto por defecto: `8081`.

---

## Parte 4: Variables de Entorno de Referencia (`.env`)

Para cualquier entorno de despliegue, asegúrate de contemplar las siguientes variables (basadas en [`.env.example`](./.env.example)):

```env
# Configuración de Seguridad y Servidor
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
JWT_SECRET=nova_salud_secreto_curso_2026
JWT_EXPIRES_IN=24h

# Configuración de Base de Datos (Opcional si se usa el motor In-Memory integrado)
DB_SERVER=localhost
DB_PORT=1433
DB_USER=novasalud
DB_PASSWORD=TuPasswordSeguro2026!
DB_DATABASE=NovaSalud
DB_ENCRYPT=false

# URL del API para el Frontend (Solo necesario si el Frontend se aloja en otro dominio)
VITE_API_URL=/api
```

