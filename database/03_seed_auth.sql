-- ==============================================================================
-- NOVA SALUD - SEED 03: CONTRASEÑAS HASHEADADES DE USUARIOS SEMILLA
-- Ejecutar DESPUÉS de 01_schema.sql, 02_seed.sql y 03_migration.sql.
--
-- Contraseñas en texto plano (solo para entorno de desarrollo/seed):
--   DNI 10203040 (Administrador root): regente2026
--   DNI 71829304 (Cajero / Vendedor):   caja2026
--   DNI 76543210 (Almacén):             almacen2026
-- CAMBIAR estas contraseñas en producción.
-- ==============================================================================

UPDATE perfiles_usuario
SET password_hash = '$2a$10$01GD43MmqDILyzT2xgz7BeIN0ACKB2l930g7NX8659wN/5JFL/wqK',
    debe_cambiar_clave = 0,
    fecha_actualizacion = SYSDATETIME()
WHERE dni = '10203040';

UPDATE perfiles_usuario
SET password_hash = '$2a$10$DGVYCJeNI5SsHohZcXHc.u.FAh58KzD.bbUSzIQow2.GDSLBrPfQi',
    debe_cambiar_clave = 0,
    fecha_actualizacion = SYSDATETIME()
WHERE dni = '71829304';

UPDATE perfiles_usuario
SET password_hash = '$2a$10$QZx7MFTDSuEudgEyvU9OQex8qZXTaYFPQ692VF3pzrnqjZBKQ3Bam',
    debe_cambiar_clave = 0,
    fecha_actualizacion = SYSDATETIME()
WHERE dni = '76543210';

PRINT 'Contraseñas de semilla hasheadas con bcrypt (10 rounds).';
