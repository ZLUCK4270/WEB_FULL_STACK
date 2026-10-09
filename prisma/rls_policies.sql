-- ==============================================================================
-- BOTICA NOVA SALUD - POLÍTICAS DE ROW LEVEL SECURITY (RLS) & TRIGGERS POSTGRESQL
-- Base de Datos: Supabase (PostgreSQL 15)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONES Y FUNCIONES AUXILIARES DE AUTORIZACIÓN DINÁMICA
-- ------------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para verificar si el usuario autenticado tiene un permiso específico
CREATE OR REPLACE FUNCTION public.has_permission(
  p_module_id VARCHAR,
  p_action VARCHAR -- 'view', 'create', 'edit', 'delete'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_is_root BOOLEAN;
  v_has_perm BOOLEAN := false;
BEGIN
  -- Obtener el UUID del token JWT de Supabase
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Verificar si es el Administrador Propietario (Acceso total inmutable)
  SELECT is_root_admin INTO v_is_root
  FROM public.users_profile
  WHERE id = v_user_id AND is_active = true;

  IF v_is_root IS TRUE THEN
    RETURN true;
  END IF;

  -- 2. Evaluar matriz user_permissions según la acción requerida
  SELECT 
    CASE 
      WHEN p_action = 'view'   THEN can_view
      WHEN p_action = 'create' THEN can_create
      WHEN p_action = 'edit'   THEN can_edit
      WHEN p_action = 'delete' THEN can_delete
      ELSE false
    END INTO v_has_perm
  FROM public.user_permissions
  WHERE user_id = v_user_id AND module_id = p_module_id;

  RETURN COALESCE(v_has_perm, false);
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. HABILITACIÓN DE ROW LEVEL SECURITY EN TODAS LAS TABLAS
-- ------------------------------------------------------------------------------

ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_item_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replenishment_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS RLS: PERFILES Y GESTIÓN DE USUARIOS
-- ------------------------------------------------------------------------------

-- users_profile: Cada usuario puede leer su propio perfil; Admin lee todos
DROP POLICY IF EXISTS "users_profile_select_policy" ON public.users_profile;
CREATE POLICY "users_profile_select_policy" ON public.users_profile
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR public.has_permission('auth_rbac', 'view')
  );

-- users_profile: Solo Administrador con permiso auth_rbac.create puede insertar
DROP POLICY IF EXISTS "users_profile_insert_policy" ON public.users_profile;
CREATE POLICY "users_profile_insert_policy" ON public.users_profile
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_permission('auth_rbac', 'create')
  );

-- users_profile: Solo Admin puede editar; el usuario puede cambiar su password/foto básica
DROP POLICY IF EXISTS "users_profile_update_policy" ON public.users_profile;
CREATE POLICY "users_profile_update_policy" ON public.users_profile
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid() OR public.has_permission('auth_rbac', 'edit')
  );

-- ------------------------------------------------------------------------------
-- 4. POLÍTICAS RLS: MATRIZ DE PERMISOS
-- ------------------------------------------------------------------------------

-- user_permissions: Cada usuario puede leer sus propios permisos; Admin lee y muta
DROP POLICY IF EXISTS "user_permissions_select_policy" ON public.user_permissions;
CREATE POLICY "user_permissions_select_policy" ON public.user_permissions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.has_permission('auth_rbac', 'view')
  );

DROP POLICY IF EXISTS "user_permissions_mutation_policy" ON public.user_permissions;
CREATE POLICY "user_permissions_mutation_policy" ON public.user_permissions
  FOR ALL
  TO authenticated
  USING (
    public.has_permission('auth_rbac', 'edit')
  )
  WITH CHECK (
    public.has_permission('auth_rbac', 'edit')
  );

-- ------------------------------------------------------------------------------
-- 5. POLÍTICAS RLS: CATÁLOGO DE PRODUCTOS Y LOTES
-- ------------------------------------------------------------------------------

-- products: Cualquier usuario autenticado con permiso 'inventory_batches.view' puede leer
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
CREATE POLICY "products_select_policy" ON public.products
  FOR SELECT
  TO authenticated
  USING (
    public.has_permission('inventory_batches', 'view')
  );

DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
CREATE POLICY "products_insert_policy" ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_permission('inventory_batches', 'create')
  );

DROP POLICY IF EXISTS "products_update_policy" ON public.products;
CREATE POLICY "products_update_policy" ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    public.has_permission('inventory_batches', 'edit')
  );

-- batches: Solo lectura con permiso de inventario o mostrador POS
DROP POLICY IF EXISTS "batches_select_policy" ON public.batches;
CREATE POLICY "batches_select_policy" ON public.batches
  FOR SELECT
  TO authenticated
  USING (
    public.has_permission('inventory_batches', 'view') OR public.has_permission('pos_sales', 'view')
  );

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS RLS: VENTAS (PUNTO DE VENTA POS)
-- ------------------------------------------------------------------------------

-- sales: Cajero ve sus propias ventas; Supervisor/Admin ve todas
DROP POLICY IF EXISTS "sales_select_policy" ON public.sales;
CREATE POLICY "sales_select_policy" ON public.sales
  FOR SELECT
  TO authenticated
  USING (
    cashier_id = auth.uid() OR public.has_permission('pos_sales', 'view')
  );

-- sales: Solo cajeros con permiso 'pos_sales.create' pueden insertar
DROP POLICY IF EXISTS "sales_insert_policy" ON public.sales;
CREATE POLICY "sales_insert_policy" ON public.sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_permission('pos_sales', 'create')
  );

-- sales: Solo supervisores con 'pos_sales.delete' pueden anular ventas
DROP POLICY IF EXISTS "sales_update_policy" ON public.sales;
CREATE POLICY "sales_update_policy" ON public.sales
  FOR UPDATE
  TO authenticated
  USING (
    public.has_permission('pos_sales', 'delete')
  );

-- ------------------------------------------------------------------------------
-- 7. POLÍTICAS RLS: AUDITORÍA INMUTABLE & ALERTAS
-- ------------------------------------------------------------------------------

-- stock_alerts: Lectura por almaceneros y supervisores
DROP POLICY IF EXISTS "alerts_select_policy" ON public.stock_alerts;
CREATE POLICY "alerts_select_policy" ON public.stock_alerts
  FOR SELECT
  TO authenticated
  USING (
    public.has_permission('alerts_replenishment', 'view')
  );

-- system_audit_logs: Solo Administrador puede leer
DROP POLICY IF EXISTS "audit_select_policy" ON public.system_audit_logs;
CREATE POLICY "audit_select_policy" ON public.system_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.has_permission('audit_forensics', 'view')
  );

-- Inserción de logs permitida a todos los servicios
DROP POLICY IF EXISTS "audit_insert_policy" ON public.system_audit_logs;
CREATE POLICY "audit_insert_policy" ON public.system_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. TRIGGER INMUTABILIDAD FORENSE: PROHIBICIÓN TOTAL DE DELETE/UPDATE EN AUDITORÍA
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'VIOLACIÓN DE SEGURIDAD: Los registros de auditoría forense de Botica Nova Salud son inmutables por normativa de salud.';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_audit_logs ON public.system_audit_logs;
CREATE TRIGGER trg_protect_audit_logs
  BEFORE UPDATE OR DELETE ON public.system_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_tampering();

-- ------------------------------------------------------------------------------
-- 9. TRIGGER DE PROTECCIÓN DEL ADMINISTRADOR PROPIETARIO
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_root_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_root_admin IS TRUE AND (NEW.is_active IS FALSE OR TG_OP = 'DELETE') THEN
    RAISE EXCEPTION 'VIOLACIÓN DE REGLA BR-SEC-01: El Administrador Propietario no puede ser desactivado ni eliminado.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_root_admin ON public.users_profile;
CREATE TRIGGER trg_protect_root_admin
  BEFORE UPDATE OR DELETE ON public.users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_root_admin();
