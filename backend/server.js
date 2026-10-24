require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { getPool, closePool } = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const cashRoutes = require('./src/routes/cashRoutes');
const alertsRoutes = require('./src/routes/alertsRoutes');
const auditRoutes = require('./src/routes/auditRoutes');
const purchasesRoutes = require('./src/routes/purchasesRoutes');
const customersRoutes = require('./src/routes/customersRoutes');
const backupRoutes = require('./src/routes/backupRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 8081;

// Cabeceras de seguridad reforzadas (equivalente nativo a helmet)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  next();
});

// CORS: en producción restringir a CORS_ORIGIN; en desarrollo se espeja el origen.
const corsOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : '*');
app.use(cors({ origin: corsOrigin, credentials: true }));

app.use(express.json({ limit: '10mb' }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'novasalud-backend', timestamp: new Date().toISOString() });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores (no filtra stacktrace al cliente en producción)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProduction ? 'Error interno del servidor' : err.message || 'Error interno del servidor'
  });
});

process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

app.listen(PORT, async () => {
  try {
    await getPool();
    console.log(`Servidor backend escuchando en puerto ${PORT}`);
    console.log('Conectado a SQL Server');
  } catch (err) {
    console.error('Error conectando a SQL Server:', err.message);
  }
});

module.exports = app;
