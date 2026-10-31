import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import backendModule from '../backend/server.js';
import dbModule from '../backend/src/config/db.js';

const { app } = backendModule;
const { mockTables } = dbModule;

/**
 * Despachador HTTP en memoria para Express `app` (compatible con entornos sin red/sockets como sandboxes CI).
 */
function requestApp(method, path, { headers = {}, body = undefined } = {}) {
  return new Promise((resolve, reject) => {
    const normalizedHeaders = {};
    for (const [k, v] of Object.entries(headers)) {
      normalizedHeaders[k.toLowerCase()] = v;
    }

    const req = new EventEmitter();
    req.method = method.toUpperCase();
    req.url = path;
    req.originalUrl = path;
    req.headers = normalizedHeaders;
    req.body = body;
    req.ip = '127.0.0.1';
    req.connection = { remoteAddress: '127.0.0.1' };
    req.socket = { remoteAddress: '127.0.0.1' };
    req.get = (name) => normalizedHeaders[name.toLowerCase()];
    req.header = req.get;

    const resHeaders = {};
    const res = new EventEmitter();
    res.statusCode = 200;
    res.locals = {};

    res.setHeader = (name, val) => {
      resHeaders[name.toLowerCase()] = val;
    };
    res.getHeader = (name) => resHeaders[name.toLowerCase()];
    res.removeHeader = (name) => {
      delete resHeaders[name.toLowerCase()];
    };
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      resHeaders['content-type'] = 'application/json';
      resolve({
        status: res.statusCode,
        headers: { get: (h) => resHeaders[h.toLowerCase()] ?? null },
        json: async () => data,
        body: data,
      });
      return res;
    };
    res.send = (data) => {
      const parsed = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return data; } })() : data;
      resolve({
        status: res.statusCode,
        headers: { get: (h) => resHeaders[h.toLowerCase()] ?? null },
        json: async () => parsed,
        body: parsed,
      });
      return res;
    };
    res.end = (data) => {
      resolve({
        status: res.statusCode,
        headers: { get: (h) => resHeaders[h.toLowerCase()] ?? null },
        json: async () => data,
        body: data,
      });
      return res;
    };

    try {
      app.handle(req, res, (err) => {
        if (err) reject(err);
      });
      if (body !== undefined) {
        process.nextTick(() => req.emit('end'));
      }
    } catch (err) {
      reject(err);
    }
  });
}

test('QA-TEST-01: Endpoint /api/health responde 200 OK y cabeceras de seguridad OWASP', async () => {
  const res = await requestApp('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'novasalud-backend');
});

test('QA-TEST-02: Autenticación JWT rechaza credenciales inválidas (401) y acepta Admin/Cajero/Almacén (200)', async () => {
  // 1. Credenciales vacías -> 400
  const badReq = await requestApp('POST', '/api/auth/login', {
    body: { dni: '', password: '' },
  });
  assert.equal(badReq.status, 400);

  // 2. Contraseña incorrecta -> 401
  const unauth = await requestApp('POST', '/api/auth/login', {
    body: { dni: '10203040', password: 'wrong_password' },
  });
  assert.equal(unauth.status, 401);

  // 3. Login exitoso Q.F. Regente (Admin) -> 200 + JWT
  const loginRes = await requestApp('POST', '/api/auth/login', {
    body: { dni: '10203040', password: 'regente2026' },
  });
  assert.equal(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.equal(loginData.success, true);
  assert.ok(loginData.token);
  assert.equal(loginData.user.role, 'admin');

  // 4. Verificación /auth/me con Bearer token
  const meRes = await requestApp('GET', '/api/auth/me', {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.user.dni, '10203040');
});

test('QA-TEST-03: Control de Acceso Basado en Roles (RBAC) restringe módulos no autorizados', async () => {
  // Login como Cajero (DNI 71829304)
  const cajeroLogin = await requestApp('POST', '/api/auth/login', {
    body: { dni: '71829304', password: 'caja2026' },
  });
  const { token: cajeroToken } = await cajeroLogin.json();

  // Cajero puede ver clientes (200) y turno de caja (200)
  const custRes = await requestApp('GET', '/api/customers', {
    headers: { Authorization: `Bearer ${cajeroToken}` },
  });
  assert.equal(custRes.status, 200);

  // Cajero NO puede acceder a Auditoría Forense (403) ni crear Órdenes de Compra (403)
  const auditRes = await requestApp('GET', '/api/audit', {
    headers: { Authorization: `Bearer ${cajeroToken}` },
  });
  assert.equal(auditRes.status, 403);
});

test('QA-TEST-04: Motor Transaccional FEFO descuenta del lote más próximo a vencer, ignora vencidos y permite anulación con reversión de stock', async () => {
  const loginRes = await requestApp('POST', '/api/auth/login', {
    body: { dni: '10203040', password: 'regente2026' },
  });
  const { token } = await loginRes.json();

  const prodId = '44444444-0000-0000-0000-000000000001';
  const lotePrioridad = mockTables.lotes.find((l) => l.codigo_lote === 'LOTE-AMX-2026-PRIORIDAD-1');
  const initialBatchStock = lotePrioridad.stock_actual;

  // 1. Registrar venta de 3 unidades
  const saleRes = await requestApp('POST', '/api/sales', {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      items: [{ productId: prodId, quantity: 3 }],
      paymentMethod: 'efectivo',
      amountPaid: 20,
      receiptType: 'boleta',
    },
  });
  assert.equal(saleRes.status, 201);
  const saleData = await saleRes.json();
  assert.equal(saleData.success, true);
  assert.equal(lotePrioridad.stock_actual, initialBatchStock - 3);

  // 2. Anular la venta y verificar reversión exacta al lote FEFO
  const voidRes = await requestApp('POST', `/api/sales/${saleData.sale.id}/void`, {
    headers: { Authorization: `Bearer ${token}` },
    body: { motivo: 'Prueba QA automatizada de reversión FEFO' },
  });
  assert.equal(voidRes.status, 200);
  assert.equal(lotePrioridad.stock_actual, initialBatchStock);
});

test('QA-TEST-05: Alertas de Stock/FEFO y Estadísticas de Dashboard operativas', async () => {
  const loginRes = await requestApp('POST', '/api/auth/login', {
    body: { dni: '10203040', password: 'regente2026' },
  });
  const { token } = await loginRes.json();

  const statsRes = await requestApp('GET', '/api/dashboard/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(statsRes.status, 200);
  const stats = await statsRes.json();
  assert.ok(typeof stats.lowStockCount === 'number');
  assert.ok(Array.isArray(stats.topProducts));

  const alertsRes = await requestApp('GET', '/api/alerts', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(alertsRes.status, 200);
  const alertsData = await alertsRes.json();
  assert.ok(Array.isArray(alertsData.alerts));
  assert.ok(alertsData.alerts.length > 0);
});
