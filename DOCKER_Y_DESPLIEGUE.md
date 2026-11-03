# 🚀 Guía de Despliegue 100% Gratuito — Botica Nova Salud

Esta guía explica cómo desplegar la aplicación Full-Stack (**Frontend React 19 + Backend API Express**) en la nube de forma **completamente gratuita y sin costo alguno**, aprovechando la arquitectura unificada de [`server.ts`](./server.ts) y su base de datos transaccional integrada.

---

## ⚡ Método Recomendado: Render.com (Gratis y Directo)

> **Costo:** \$0.00 USD (No requiere tarjeta de crédito para el plan Free).  
> **Tiempo estimado:** 3 a 5 minutos.  
> **Resultado:** Tu aplicación funcionando en `https://tu-proyecto.onrender.com` con HTTPS automático.

### Paso 1: Subir el proyecto a GitHub
Si aún no lo has subido, ejecuta en tu terminal local:
```bash
git init
git add .
git commit -m "feat: proyecto listo para despliegue"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

### Paso 2: Crear el Web Service en Render
1. Entra a [dashboard.render.com](https://dashboard.render.com/) e inicia sesión (con tu cuenta de GitHub).
2. Haz clic en el botón **New +** y selecciona **Web Service**.
3. Selecciona **Build and deploy from a Git repository** y conecta tu repositorio.

### Paso 3: Configurar los campos exactos
Llena el formulario con los siguientes valores:

| Campo | Valor a colocar |
| :--- | :--- |
| **Name** | `botica-nova-salud` (o el nombre que elijas) |
| **Language / Runtime** | `Node` |
| **Branch** | `main` |
| **Region** | La más cercana (ej. `Ohio (US East)` o `Frankfurt`) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** ($0/month) |

### Paso 4: Configurar Variables de Entorno
En esa misma pantalla, baja a la sección **Environment Variables** y añade las siguientes 3 variables:

| Key | Value | Descripción |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Activa el modo producción y servicio de archivos estáticos. |
| `PORT` | `3000` | Puerto interno (Render lo gestiona automáticamente). |
| `JWT_SECRET` | `novasalud_secreto_prod_2026_seguro` | Clave secreta para la firma de tokens JWT. |

*(Nota: No necesitas configurar variables de base de datos SQL Server; el sistema utiliza automáticamente el adaptador transaccional en memoria con todo el catálogo farmacéutico peruano, usuarios y lotes FEFO precargados).*

### Paso 5: Desplegar
1. Haz clic en **Create Web Service**.
2. Espera a que Render complete el build (`vite build`) y arranque el servidor.
3. ¡Listo! Abre la URL pública generada (ej. `https://botica-nova-salud.onrender.com`).

---

## 🔑 Credenciales para Iniciar Sesión en la App Desplegada

Una vez abierto el enlace en tu navegador, ingresa con cualquiera de estos usuarios preconfigurados:

| Rol / Cargo | Correo de Acceso | DNI Alternativo | Contraseña |
| :--- | :--- | :--- | :--- |
| **Administrador General / Q.F.** | `admin@novasalud.pe` | `10203040` | `regente2026` |
| **Cajero POS / Técnico Farmacia** | `cajero@novasalud.pe` | `71829304` | `caja2026` |
| **Jefe de Almacén (BPA & FEFO)** | `almacen@novasalud.pe` | `76543210` | `almacen2026` |

---

## 🌐 Opción Alternativa Gratuita: Koyeb

Si prefieres otra plataforma con plan Free permanente (sin tarjeta requerida):

1. Regístrate en [koyeb.com](https://www.koyeb.com/).
2. Haz clic en **Create Service** y selecciona **GitHub**.
3. Elige el repositorio y en la configuración de despliegue define:
   - **Builder:** `Buildpack` o `Dockerfile`
   - **Build Command:** `npm run build`
   - **Run Command:** `npm start`
   - **Instance Type:** `Nano` (Free Tier 100% gratis).
   - **Port:** `3000` con protocolo `HTTP`.
4. Añade la variable `NODE_ENV=production` y `JWT_SECRET=tu_clave_secreta`.
5. Haz clic en **Deploy**.

---

## 🛠️ Prueba de Producción en Entorno Local (Previo al Despliegue)

Para verificar en tu propia máquina exactamente cómo correrá en la nube antes de subirlo:

```bash
# 1. Compilar el frontend para producción
npm run build

# 2. Iniciar el servidor unificado
npm start
```
Abre en tu navegador: **`http://localhost:3000`**.

---

## 🐳 Anexo: Ejecución Opcional con Docker Local

Si deseas correr el entorno completo multicontenedor con SQL Server 2022 en tu máquina:

```powershell
# Levantar Frontend, Backend y SQL Server 2022
docker compose up -d --build

# Ver estado de los contenedores
docker compose ps

# Detener los contenedores
docker compose down
```
- **Frontend Nginx:** `http://localhost:3080`
- **Backend API:** `http://localhost:8081`
- **SQL Server:** Puerto `1433`
