-- ==============================================================================
-- NOVA SALUD - MIGRACIÓN 03: SOPORTE DE CONTRASEÑAS HASHEADAS (BCRYPT)
-- Ejecutar DESPUÉS de 01_schema.sql (y 02_seed.sql si se desea poblar).
-- Idempotente: se puede ejecutir varias veces de forma segura.
-- ==============================================================================

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('perfiles_usuario')
                 AND name = 'password_hash')
BEGIN
    ALTER TABLE perfiles_usuario ADD password_hash NVARCHAR(512) NULL;
    PRINT 'Columna password_hash agregada a perfiles_usuario.';
END
ELSE
BEGIN
    PRINT 'La columna password_hash ya existe en perfiles_usuario.';
END

GO

-- Índice para búsquedas rápidas de login por DNI (ya es UNIQUE, se mantiene).
PRINT 'Migracion 03 aplicada.';
