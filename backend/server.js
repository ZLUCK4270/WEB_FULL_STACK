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

const apiRouter = express.Router();

// CORS
apiRouter.use(cors());
apiRouter.use(express.json({ limit: '10mb' }));

// Rutas de la API
apiRouter.use('/auth', authRoutes);
apiRouter.use('/sales', salesRoutes);
apiRouter.use('/inventory', inventoryRoutes);
apiRouter.use('/cash', cashRoutes);
apiRouter.use('/alerts', alertsRoutes);
apiRouter.use('/audit', auditRoutes);
apiRouter.use('/purchases', purchasesRoutes);
apiRouter.use('/customers', customersRoutes);
apiRouter.use('/backups', backupRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

// Ruta de salud
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'novasalud-backend', timestamp: new Date().toISOString() });
});

// Manejo de rutas no encontradas dentro de /api
apiRouter.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores dentro de /api
apiRouter.use((err, req, res, next) => {
  console.error(err.stack);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProduction ? 'Error interno del servidor' : err.message || 'Error interno del servidor'
  });
});

const app = express();
const PORT = process.env.PORT || 8081;

app.use('/api', apiRouter);

if (require.main === module) {
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
    } catch (err) {
      console.error('Error conectando a BD:', err.message);
    }
  });
}

module.exports = { app, apiRouter };
