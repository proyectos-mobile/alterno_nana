/*
  # Funciones adicionales para Multi-tenant
  
  Funciones helper para el manejo de stock y reportes
  en el sistema multi-tenant.
*/

-- Función para actualizar stock de productos
CREATE OR REPLACE FUNCTION actualizar_stock(
  p_producto_id uuid,
  p_cantidad integer,
  p_tenant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Función para obtener productos más vendidos
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

-- Función para obtener ventas por categoría
CREATE OR REPLACE FUNCTION ventas_por_categoria(p_tenant_id uuid)
RETURNS TABLE (
  categoria_id uuid,
  categoria_nombre text,
  total_ventas bigint,
  total_ingresos numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Función para obtener resumen de ventas por período
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

-- Función para verificar stock antes de venta
CREATE OR REPLACE FUNCTION verificar_stock_disponible(
  p_productos jsonb, -- Array de objetos {producto_id, cantidad}
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
