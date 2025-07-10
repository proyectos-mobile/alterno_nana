/*
  # Migración Multi-Tenant para Papelería NANA
  
  Esta migración convierte la aplicación de papelería en un sistema multi-tenant
  donde cada papelería tiene sus datos completamente separados.
  
  1. Agregar tabla de usuarios/tenants
  2. Agregar tenant_id a todas las tablas existentes
  3. Migrar datos existentes al tenant por defecto
  4. Actualizar políticas RLS para multi-tenancy
  5. Crear funciones helper para manejo de tenants
*/

-- =========================================
-- 1. TABLA DE TENANTS (PAPELERÍAS)
-- =========================================

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL, -- Identificador único para URLs amigables (ej: "nana", "donjose")
  nombre text NOT NULL, -- Nombre de la papelería
  email text UNIQUE NOT NULL, -- Email del administrador
  telefono text,
  direccion text,
  configuracion jsonb DEFAULT '{}', -- Configuraciones específicas del tenant
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================
-- 2. TABLA DE USUARIOS
-- =========================================

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  nombre text NOT NULL,
  rol text DEFAULT 'admin' CHECK (rol IN ('admin', 'empleado')),
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, email) -- Un email único por tenant
);

-- =========================================
-- 3. AGREGAR TENANT_ID A TABLAS EXISTENTES
-- =========================================

-- Agregar tenant_id a categorias
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

-- Agregar tenant_id a productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

-- Agregar tenant_id a ventas
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

-- Agregar tenant_id a detalle_ventas
ALTER TABLE detalle_ventas ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE;

-- =========================================
-- 4. CREAR TENANT POR DEFECTO Y MIGRAR DATOS
-- =========================================

-- Insertar tenant por defecto (Papelería NANA)
INSERT INTO tenants (slug, nombre, email, telefono, direccion)
VALUES (
  'nana',
  'Papelería NANA',
  'admin@papelerianana.com',
  '+57 300 123 4567',
  'Calle Principal #123, Ciudad'
) ON CONFLICT (slug) DO NOTHING;

-- Crear usuario administrador por defecto
INSERT INTO usuarios (tenant_id, email, nombre, rol)
SELECT 
  t.id,
  'admin@papelerianana.com',
  'Administrador NANA',
  'admin'
FROM tenants t 
WHERE t.slug = 'nana'
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Migrar datos existentes al tenant por defecto
UPDATE categorias 
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'nana')
WHERE tenant_id IS NULL;

UPDATE productos 
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'nana')
WHERE tenant_id IS NULL;

UPDATE ventas 
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'nana')
WHERE tenant_id IS NULL;

UPDATE detalle_ventas 
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'nana')
WHERE tenant_id IS NULL;

-- =========================================
-- 5. HACER TENANT_ID OBLIGATORIO
-- =========================================

-- Después de migrar los datos, hacer tenant_id NOT NULL
ALTER TABLE categorias ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE productos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE ventas ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE detalle_ventas ALTER COLUMN tenant_id SET NOT NULL;

-- =========================================
-- 6. HABILITAR RLS EN NUEVAS TABLAS
-- =========================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- =========================================
-- 7. ELIMINAR POLÍTICAS ANTERIORES
-- =========================================

DROP POLICY IF EXISTS "Acceso público a categorías" ON categorias;
DROP POLICY IF EXISTS "Acceso público a productos" ON productos;
DROP POLICY IF EXISTS "Acceso público a ventas" ON ventas;
DROP POLICY IF EXISTS "Acceso público a detalle de ventas" ON detalle_ventas;

-- =========================================
-- 8. NUEVAS POLÍTICAS MULTI-TENANT
-- =========================================

-- Políticas para tenants
CREATE POLICY "Los usuarios pueden ver su propio tenant" ON tenants
  FOR SELECT USING (
    id IN (
      SELECT tenant_id FROM usuarios 
      WHERE email = current_setting('app.current_user_email', true)
    )
  );

CREATE POLICY "Solo administradores pueden actualizar tenant" ON tenants
  FOR UPDATE USING (
    id IN (
      SELECT u.tenant_id FROM usuarios u
      WHERE u.email = current_setting('app.current_user_email', true)
      AND u.rol = 'admin'
    )
  );

-- Políticas para usuarios
CREATE POLICY "Los usuarios pueden ver usuarios de su tenant" ON usuarios
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios 
      WHERE email = current_setting('app.current_user_email', true)
    )
  );

-- Políticas para categorías
CREATE POLICY "Acceso a categorías por tenant" ON categorias
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios 
      WHERE email = current_setting('app.current_user_email', true)
    )
  );

-- Políticas para productos
CREATE POLICY "Acceso a productos por tenant" ON productos
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios 
      WHERE email = current_setting('app.current_user_email', true)
    )
  );

-- Políticas para ventas
CREATE POLICY "Acceso a ventas por tenant" ON ventas
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios 
      WHERE email = current_setting('app.current_user_email', true)
    )
  );

-- Políticas para detalle_ventas
CREATE POLICY "Acceso a detalle_ventas por tenant" ON detalle_ventas
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM usuarios 
      WHERE email = current_setting('app.current_user_email', true)
    )
  );

-- =========================================
-- 9. ÍNDICES ADICIONALES PARA PERFORMANCE
-- =========================================

CREATE INDEX IF NOT EXISTS idx_categorias_tenant_id ON categorias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_productos_tenant_id ON productos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ventas_tenant_id ON ventas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_tenant_id ON detalle_ventas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_id ON usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- =========================================
-- 10. FUNCIONES HELPER
-- =========================================

-- Función para obtener el tenant_id del usuario actual
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_uuid uuid;
BEGIN
  SELECT tenant_id INTO tenant_uuid
  FROM usuarios
  WHERE email = current_setting('app.current_user_email', true);
  
  RETURN tenant_uuid;
END;
$$;

-- Función para crear un nuevo tenant
CREATE OR REPLACE FUNCTION create_new_tenant(
  p_slug text,
  p_nombre text,
  p_email text,
  p_admin_nombre text,
  p_telefono text DEFAULT NULL,
  p_direccion text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_tenant_id uuid;
  new_user_id uuid;
  result json;
BEGIN
  -- Crear el tenant
  INSERT INTO tenants (slug, nombre, email, telefono, direccion)
  VALUES (p_slug, p_nombre, p_email, p_telefono, p_direccion)
  RETURNING id INTO new_tenant_id;
  
  -- Crear el usuario administrador
  INSERT INTO usuarios (tenant_id, email, nombre, rol)
  VALUES (new_tenant_id, p_email, p_admin_nombre, 'admin')
  RETURNING id INTO new_user_id;
  
  -- Crear categorías por defecto
  INSERT INTO categorias (tenant_id, nombre, descripcion) VALUES
  (new_tenant_id, 'Papelería', 'Artículos de papelería general'),
  (new_tenant_id, 'Escolar', 'Útiles escolares'),
  (new_tenant_id, 'Oficina', 'Artículos de oficina');
  
  -- Retornar resultado
  SELECT json_build_object(
    'success', true,
    'tenant_id', new_tenant_id,
    'user_id', new_user_id,
    'message', 'Tenant creado exitosamente'
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Función trigger para actualizar updated_at en tenants
CREATE OR REPLACE FUNCTION update_tenant_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para tenants
CREATE TRIGGER trigger_update_tenant_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_updated_at();

-- Trigger para usuarios
CREATE TRIGGER trigger_update_usuario_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_updated_at();
