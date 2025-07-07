/*
  # Esquema de Base de Datos para Papelería NANA

  1. Nuevas Tablas
    - `categorias`
      - `id` (uuid, clave primaria)
      - `nombre` (text, único)
      - `descripcion` (text)
      - `created_at` (timestamp)
    - `productos`
      - `id` (uuid, clave primaria)
      - `nombre` (text)
      - `precio` (numeric)
      - `stock` (integer)
      - `descripcion` (text)
      - `categoria_id` (uuid, clave foránea)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `ventas`
      - `id` (uuid, clave primaria)
      - `fecha` (date)
      - `total` (numeric)
      - `created_at` (timestamp)
    - `detalle_ventas`
      - `id` (uuid, clave primaria)
      - `venta_id` (uuid, clave foránea)
      - `producto_id` (uuid, clave foránea)
      - `cantidad` (integer)
      - `precio_unitario` (numeric)
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Agregar políticas para operaciones CRUD públicas (aplicación sin autenticación)

  3. Índices
    - Índices para búsquedas optimizadas
    - Claves foráneas para integridad referencial
*/

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text UNIQUE NOT NULL,
  descripcion text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  precio numeric(10,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  descripcion text DEFAULT '',
  categoria_id uuid REFERENCES categorias(id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de detalle de ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad integer NOT NULL DEFAULT 1,
  precio_unitario numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_ventas ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (sin autenticación)
CREATE POLICY "Acceso público a categorías" ON categorias FOR ALL USING (true);
CREATE POLICY "Acceso público a productos" ON productos FOR ALL USING (true);
CREATE POLICY "Acceso público a ventas" ON ventas FOR ALL USING (true);
CREATE POLICY "Acceso público a detalle de ventas" ON detalle_ventas FOR ALL USING (true);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta_id ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_producto_id ON detalle_ventas(producto_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para productos
CREATE TRIGGER update_productos_updated_at 
    BEFORE UPDATE ON productos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar categorías de ejemplo
INSERT INTO categorias (nombre, descripcion) VALUES 
  ('Escritura', 'Productos para escribir y tomar notas'),
  ('Oficina', 'Artículos de oficina y papelería empresarial'),
  ('Escolar', 'Materiales escolares y educativos'),
  ('Arte', 'Materiales para dibujo y manualidades')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, precio, stock, descripcion, categoria_id) 
SELECT 
  p.nombre,
  p.precio,
  p.stock,
  p.descripcion,
  c.id
FROM (
  VALUES 
    ('Bolígrafo Azul BIC', 1.50, 100, 'Bolígrafo de tinta azul clásico', 'Escritura'),
    ('Cuaderno A4 100 Hojas', 3.25, 50, 'Cuaderno rayado tamaño A4', 'Escolar'),
    ('Marcador Permanente Negro', 2.80, 30, 'Marcador de tinta permanente', 'Oficina'),
    ('Lápices de Colores x12', 8.90, 25, 'Set de 12 lápices de colores', 'Arte'),
    ('Goma de Borrar', 0.75, 200, 'Goma de borrar blanca estándar', 'Escolar'),
    ('Regla 30cm', 1.20, 40, 'Regla de plástico transparente', 'Escolar'),
    ('Tijeras Escolares', 4.50, 20, 'Tijeras de punta redonda', 'Escolar'),
    ('Pegamento en Barra', 2.10, 60, 'Pegamento en barra 21g', 'Oficina')
) AS p(nombre, precio, stock, descripcion, categoria_nombre)
JOIN categorias c ON c.nombre = p.categoria_nombre
ON CONFLICT DO NOTHING;