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

const app = express();
const PORT = process.env.PORT || 8081;

app.use(cors());
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

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'novasalud-backend', timestamp: new Date().toISOString() });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message });
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
