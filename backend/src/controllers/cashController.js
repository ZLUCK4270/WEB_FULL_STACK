const { getPool, mockTables } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

async function getCurrentShift(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query("SELECT * FROM turnos_caja WHERE estado = 'ABIERTO'");

    if (result.recordset.length === 0) {
      return res.json({ activeShift: null });
    }

    const shift = result.recordset[0];

    // Compute sales in cash during this shift
    const cashSales = (mockTables.ventas || [])
      .filter(v => v.metodo_pago === 'efectivo' && v.estado === 'COMPLETADA' && v.fecha_creacion >= shift.fecha_apertura)
      .reduce((sum, v) => sum + (parseFloat(v.monto_total) || 0), 0);

    const extraIngresos = (mockTables.movimientos_caja || [])
      .filter(m => m.turno_id === shift.id && m.tipo === 'INGRESO' && m.motivo !== 'Fondo de caja inicial')
      .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

    const extraEgresos = (mockTables.movimientos_caja || [])
      .filter(m => m.turno_id === shift.id && m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

    const calculatedExpected = parseFloat((shift.fondo_inicial + cashSales + extraIngresos - extraEgresos).toFixed(2));
    shift.efectivo_esperado = calculatedExpected;

    const shiftObj = {
      id: shift.id,
      cajeroId: shift.cajero_id,
      cajero_id: shift.cajero_id,
      cajeroNombre: shift.cajero_nombre || req.user.name,
      cajero_nombre: shift.cajero_nombre || req.user.name,
      fechaApertura: shift.fecha_apertura,
      fecha_apertura: shift.fecha_apertura,
      fechaCierre: shift.fecha_cierre,
      fecha_cierre: shift.fecha_cierre,
      fondoInicial: parseFloat(shift.fondo_inicial),
      monto_apertura: parseFloat(shift.fondo_inicial),
      efectivoEsperado: calculatedExpected,
      monto_cierre_esperado: calculatedExpected,
      totalVentasEfectivo: cashSales,
      total_ventas_efectivo: cashSales,
      totalIngresosExtra: extraIngresos,
      total_ingresos_extra: extraIngresos,
      totalEgresosExtra: extraEgresos,
      total_egresos_extra: extraEgresos,
      estado: shift.estado,
      observaciones: shift.observaciones
    };

    res.json({
      success: true,
      activeShift: shiftObj,
      shift: shiftObj
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function openCashRegister(req, res) {
  try {
    const rawFund = req.body.initialFund !== undefined ? req.body.initialFund : req.body.montoInicial;
    const shift = req.body.shift || 'MAÑANA';
    const observations = req.body.observations || req.body.notas || '';
    const cashierId = req.user.id;
    const fund = parseFloat(rawFund);

    if (!Number.isFinite(fund) || fund < 0) {
      return res.status(400).json({ error: 'El fondo inicial debe ser un número mayor o igual a 0' });
    }

    const pool = await getPool();

    // Validar si ya hay un turno abierto
    const existing = await pool.request().query("SELECT id FROM turnos_caja WHERE estado = 'ABIERTO'");
    if (existing.recordset.length > 0) {
      return res.status(409).json({ error: 'Ya existe un turno de caja abierto. Debe cerrarlo antes de iniciar otro.' });
    }

    const result = await pool.request()
      .input('cajeroId', cashierId)
      .input('fondoInicial', fund)
      .input('observaciones', observations || `Turno ${shift}`)
      .query(`
        INSERT INTO turnos_caja (cajero_id, fondo_inicial, observaciones)
        OUTPUT INSERTED.id
        VALUES (@cajeroId, @fondoInicial, @observaciones)
      `);

    const shiftId = result.recordset[0].id;

    // Registrar movimiento de apertura
    await pool.request()
      .input('turnoId', shiftId)
      .input('tipo', 'INGRESO')
      .input('monto', fund)
      .input('motivo', 'Fondo de caja inicial')
      .query(`
        INSERT INTO movimientos_caja (turno_id, tipo, monto, motivo)
        VALUES (@turnoId, @tipo, @monto, @motivo)
      `);

    // Auditoría
    await pool.request()
      .input('usuarioId', cashierId)
      .input('accion', 'OPEN_CASH_REGISTER')
      .input('modulo', 'cash')
      .input('tablaAfectada', 'turnos_caja')
      .input('registroId', shiftId)
      .input('datosNuevos', JSON.stringify({ fund, shift }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    const createdShift = {
      id: shiftId,
      cajeroId: cashierId,
      cajero_id: cashierId,
      cajeroNombre: req.user.name,
      cajero_nombre: req.user.name,
      fechaApertura: new Date().toISOString(),
      fecha_apertura: new Date().toISOString(),
      fondoInicial: fund,
      monto_apertura: fund,
      efectivoEsperado: fund,
      monto_cierre_esperado: fund,
      totalVentasEfectivo: 0,
      total_ventas_efectivo: 0,
      totalIngresosExtra: 0,
      total_ingresos_extra: 0,
      totalEgresosExtra: 0,
      total_egresos_extra: 0,
      estado: 'ABIERTO',
      observaciones: observations || `Turno ${shift}`
    };

    res.status(201).json({
      success: true,
      message: 'Turno de caja abierto correctamente',
      shiftId,
      shift: createdShift,
      activeShift: createdShift
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function createMovement(req, res) {
  try {
    const { tipo = 'INGRESO', monto, motivo } = req.body;
    const amount = parseFloat(monto);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor a 0' });
    }

    if (!motivo || String(motivo).trim().length < 3) {
      return res.status(400).json({ error: 'Debe ingresar un motivo para el movimiento (mínimo 3 caracteres)' });
    }

    const pool = await getPool();
    const active = await pool.request().query("SELECT id FROM turnos_caja WHERE estado = 'ABIERTO'");
    if (active.recordset.length === 0) {
      return res.status(400).json({ error: 'No hay un turno de caja abierto actualmente' });
    }

    const turnoId = active.recordset[0].id;

    await pool.request()
      .input('turnoId', turnoId)
      .input('tipo', tipo.toUpperCase())
      .input('monto', amount)
      .input('motivo', String(motivo).trim())
      .query(`
        INSERT INTO movimientos_caja (turno_id, tipo, monto, motivo)
        VALUES (@turnoId, @tipo, @monto, @motivo)
      `);

    // Auditoría
    await pool.request()
      .input('usuarioId', req.user.id)
      .input('accion', `CASH_${tipo.toUpperCase()}`)
      .input('modulo', 'cash')
      .input('tablaAfectada', 'movimientos_caja')
      .input('registroId', turnoId)
      .input('datosNuevos', JSON.stringify({ tipo, amount, motivo }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.status(201).json({ success: true, message: 'Movimiento registrado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function closeCashRegister(req, res) {
  try {
    const { countedCash, observations = '' } = req.body;
    const cashierId = req.user.id;
    const counted = parseFloat(countedCash);

    if (!Number.isFinite(counted) || counted < 0) {
      return res.status(400).json({ error: 'Debe ingresar el efectivo contado físico' });
    }

    const pool = await getPool();
    const active = await pool.request().query("SELECT * FROM turnos_caja WHERE estado = 'ABIERTO'");
    if (active.recordset.length === 0) {
      return res.status(400).json({ error: 'No hay un turno de caja abierto para cerrar' });
    }

    const shift = active.recordset[0];

    // Compute expected
    const cashSales = (mockTables.ventas || [])
      .filter(v => v.metodo_pago === 'efectivo' && v.estado === 'COMPLETADA' && v.fecha_creacion >= shift.fecha_apertura)
      .reduce((sum, v) => sum + (parseFloat(v.monto_total) || 0), 0);

    const extraIngresos = (mockTables.movimientos_caja || [])
      .filter(m => m.turno_id === shift.id && m.tipo === 'INGRESO' && m.motivo !== 'Fondo de caja inicial')
      .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

    const extraEgresos = (mockTables.movimientos_caja || [])
      .filter(m => m.turno_id === shift.id && m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);

    const expected = parseFloat((shift.fondo_inicial + cashSales + extraIngresos - extraEgresos).toFixed(2));
    const difference = parseFloat((counted - expected).toFixed(2));

    await pool.request()
      .input('id', shift.id)
      .input('fechaCierre', new Date().toISOString())
      .input('efectivoContado', counted)
      .input('diferencia', difference)
      .input('estado', 'CERRADO')
      .input('observaciones', observations || (difference === 0 ? 'Cuadre exacto' : difference > 0 ? `Sobrante S/ ${difference}` : `Faltante S/ ${Math.abs(difference)}`))
      .query(`
        UPDATE turnos_caja
        SET fecha_cierre = @fechaCierre,
            efectivo_contado = @efectivoContado,
            diferencia = @diferencia,
            estado = @estado,
            observaciones = @observaciones
        WHERE id = @id
      `);

    // Auditoría
    await pool.request()
      .input('usuarioId', cashierId)
      .input('accion', 'CLOSE_CASH_REGISTER')
      .input('modulo', 'cash')
      .input('tablaAfectada', 'turnos_caja')
      .input('registroId', shift.id)
      .input('datosNuevos', JSON.stringify({ counted, expected, difference }))
      .query(`
        INSERT INTO registros_auditoria_sistema (usuario_id, accion, modulo, tabla_afectada, registro_id, datos_nuevos)
        VALUES (@usuarioId, @accion, @modulo, @tablaAfectada, @registroId, @datosNuevos)
      `);

    res.json({
      success: true,
      message: 'Caja cerrada y arqueo completado correctamente',
      summary: {
        fondoInicial: shift.fondo_inicial,
        ventasEfectivo: cashSales,
        ingresosExtra: extraIngresos,
        egresosExtra: extraEgresos,
        efectivoEsperado: expected,
        efectivoContado: counted,
        diferencia: difference,
        resultado: difference === 0 ? 'EXACTO' : difference > 0 ? 'SOBRANTE' : 'FALTANTE'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getShiftHistory(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT * FROM turnos_caja ORDER BY fecha_apertura DESC');
    res.json({ shifts: result.recordset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getCurrentShift,
  openCashRegister,
  createMovement,
  closeCashRegister,
  getShiftHistory
};
