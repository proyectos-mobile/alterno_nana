/*
  # Corrección de warnings de seguridad
  
  Esta migración corrige los warnings de "role mutable search_path" 
  en todas las funciones SECURITY DEFINER agregando SET search_path = public.
  
  Esto mejora la seguridad evitando ataques de inyección de esquema.
*/

-- 1. Corregir función set_current_user_email
CREATE OR REPLACE FUNCTION set_current_user_email(email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Establecer el email en la configuración de la sesión
  PERFORM set_config('app.current_user_email', email, false);
END;
$$;

-- 2. Corregir función get_current_tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- 3. Corregir función update_tenant_updated_at
CREATE OR REPLACE FUNCTION update_tenant_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. Corregir función create_new_tenant
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
SET search_path = public
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

-- 5. Corregir función actualizar_stock
CREATE OR REPLACE FUNCTION actualizar_stock(
  p_producto_id uuid,
  p_cantidad integer,
  p_tenant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE productos 
  SET 
    stock = stock + p_cantidad,
    updated_at = now()
  WHERE id = p_producto_id 
    AND tenant_id = p_tenant_id;
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado o no pertenece al tenant';
  END IF;
END;
$$;

-- 6. Corregir función productos_mas_vendidos
CREATE OR REPLACE FUNCTION productos_mas_vendidos(
  p_tenant_id uuid,
  p_limite integer DEFAULT 10
)
RETURNS TABLE (
  producto_id uuid,
  producto_nombre text,
  total_vendido bigint,
  total_ingresos numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.nombre,
    SUM(dv.cantidad)::bigint as total_vendido,
    SUM(dv.cantidad * dv.precio_unitario) as total_ingresos
  FROM productos p
  JOIN detalle_ventas dv ON p.id = dv.producto_id
  WHERE p.tenant_id = p_tenant_id
    AND dv.tenant_id = p_tenant_id
  GROUP BY p.id, p.nombre
  ORDER BY total_vendido DESC
  LIMIT p_limite;
END;
$$;

-- 7. Corregir función update_updated_at_column (si existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 8. Corregir función ventas_por_categoria
CREATE OR REPLACE FUNCTION ventas_por_categoria(p_tenant_id uuid)
RETURNS TABLE (
  categoria_id uuid,
  categoria_nombre text,
  total_ventas bigint,
  total_ingresos numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    COUNT(dv.id)::bigint as total_ventas,
    SUM(dv.cantidad * dv.precio_unitario) as total_ingresos
  FROM categorias c
  JOIN productos p ON c.id = p.categoria_id
  JOIN detalle_ventas dv ON p.id = dv.producto_id
  WHERE c.tenant_id = p_tenant_id
    AND p.tenant_id = p_tenant_id
    AND dv.tenant_id = p_tenant_id
  GROUP BY c.id, c.nombre
  ORDER BY total_ingresos DESC;
END;
$$;

-- 9. Corregir función resumen_ventas_periodo
CREATE OR REPLACE FUNCTION resumen_ventas_periodo(
  p_tenant_id uuid,
  p_fecha_inicio date,
  p_fecha_fin date
)
RETURNS TABLE (
  total_ventas bigint,
  total_ingresos numeric,
  promedio_venta numeric,
  productos_vendidos bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(v.id)::bigint as total_ventas,
    COALESCE(SUM(v.total), 0) as total_ingresos,
    COALESCE(AVG(v.total), 0) as promedio_venta,
    COALESCE(SUM(dv.cantidad), 0)::bigint as productos_vendidos
  FROM ventas v
  LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
  WHERE v.tenant_id = p_tenant_id
    AND v.fecha >= p_fecha_inicio
    AND v.fecha <= p_fecha_fin;
END;
$$;

-- 10. Corregir función verificar_stock_disponible
CREATE OR REPLACE FUNCTION verificar_stock_disponible(
  p_productos jsonb,
  p_tenant_id uuid
)
RETURNS TABLE (
  producto_id uuid,
  producto_nombre text,
  stock_actual integer,
  cantidad_solicitada integer,
  disponible boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  producto_item jsonb;
BEGIN
  FOR producto_item IN SELECT * FROM jsonb_array_elements(p_productos)
  LOOP
    RETURN QUERY
    SELECT 
      p.id,
      p.nombre,
      p.stock,
      (producto_item->>'cantidad')::integer,
      p.stock >= (producto_item->>'cantidad')::integer
    FROM productos p
    WHERE p.id = (producto_item->>'producto_id')::uuid
      AND p.tenant_id = p_tenant_id;
  END LOOP;
END;
$$;
