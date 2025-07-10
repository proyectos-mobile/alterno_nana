import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * Hook personalizado para consultas multi-tenant de Supabase
 * Automáticamente filtra por tenant_id en todas las consultas
 */
export const useSupabaseTenant = () => {
  const { getCurrentTenantId } = useAuth();

  const createTenantQuery = useCallback(
    (tableName) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo');
      }

      return supabase.from(tableName).select('*').eq('tenant_id', tenantId);
    },
    [getCurrentTenantId]
  );

  // Categorías
  const getCategorias = useCallback(() => {
    return createTenantQuery('categorias');
  }, [createTenantQuery]);

  const insertCategoria = useCallback(
    (categoria) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo para crear la categoría');
      }

      return supabase
        .from('categorias')
        .insert([{ ...categoria, tenant_id: tenantId }]);
    },
    [getCurrentTenantId]
  );

  const updateCategoria = useCallback(
    (id, categoria) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo para actualizar la categoría');
      }

      return supabase
        .from('categorias')
        .update(categoria)
        .eq('id', id)
        .eq('tenant_id', tenantId);
    },
    [getCurrentTenantId]
  );

  const deleteCategoria = useCallback(
    (id) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo para eliminar la categoría');
      }

      return supabase
        .from('categorias')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
    },
    [getCurrentTenantId]
  );

  // Productos
  const getProductos = useCallback(() => {
    const tenantId = getCurrentTenantId();
    return supabase
      .from('productos')
      .select(
        `
        *,
        categorias (
          id,
          nombre
        )
      `
      )
      .eq('tenant_id', tenantId);
  }, [getCurrentTenantId]);

  const insertProducto = useCallback(
    (producto) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo para crear el producto');
      }

      return supabase
        .from('productos')
        .insert([{ ...producto, tenant_id: tenantId }]);
    },
    [getCurrentTenantId]
  );

  const updateProducto = useCallback(
    (id, producto) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo para actualizar el producto');
      }

      return supabase
        .from('productos')
        .update(producto)
        .eq('id', id)
        .eq('tenant_id', tenantId);
    },
    [getCurrentTenantId]
  );

  const deleteProducto = useCallback(
    (id) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo para eliminar el producto');
      }

      return supabase
        .from('productos')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);
    },
    [getCurrentTenantId]
  );

  const updateStock = useCallback(
    (id, newStock) => {
      const tenantId = getCurrentTenantId();
      return supabase
        .from('productos')
        .update({
          stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId);
    },
    [getCurrentTenantId]
  );

  // Ventas
  const getVentas = useCallback(() => {
    const tenantId = getCurrentTenantId();
    return supabase
      .from('ventas')
      .select(
        `
        *,
        detalle_ventas (
          *,
          productos (
            id,
            nombre,
            precio
          )
        )
      `
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
  }, [getCurrentTenantId]);

  const insertVenta = useCallback(
    async (venta, productos) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo para procesar la venta');
      }

      try {
        const ventaInsertData = {
          tenant_id: tenantId,
          fecha: venta.fecha,
          total: venta.total,
        };

        // Insertar la venta principal
        const { data: ventaData, error: ventaError } = await supabase
          .from('ventas')
          .insert([ventaInsertData])
          .select()
          .single();

        if (ventaError) throw ventaError;

        // Insertar los productos de la venta y actualizar stock
        const ventaProductos = productos.map((producto) => ({
          tenant_id: tenantId,
          venta_id: ventaData.id,
          producto_id: producto.id,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio,
        }));

        const { error: productosError } = await supabase
          .from('detalle_ventas')
          .insert(ventaProductos);

        if (productosError) throw productosError;

        // Actualizar stock de productos
        for (const producto of productos) {
          // Primero obtener el stock actual
          const { data: productoActual, error: getError } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', producto.id)
            .eq('tenant_id', tenantId)
            .single();

          if (getError) throw getError;

          const nuevoStock = productoActual.stock - producto.cantidad;

          const { error: stockError } = await supabase
            .from('productos')
            .update({
              stock: nuevoStock,
              updated_at: new Date().toISOString(),
            })
            .eq('id', producto.id)
            .eq('tenant_id', tenantId);

          if (stockError) throw stockError;
        }

        return { data: ventaData, error: null };
      } catch (error) {
        console.error('Error in insertVenta:', error);
        return { data: null, error };
      }
    },
    [getCurrentTenantId]
  );

  const updateVenta = useCallback(
    async (id, venta, productos) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo para actualizar la venta');
      }

      try {
        // 1. Actualizar la venta principal
        const { error: ventaError } = await supabase
          .from('ventas')
          .update({
            fecha: venta.fecha,
            total: venta.total,
          })
          .eq('id', id)
          .eq('tenant_id', tenantId);

        if (ventaError) throw ventaError;

        // 2. Obtener productos anteriores para restaurar stock
        const { data: detallesAnteriores, error: detallesError } =
          await supabase
            .from('detalle_ventas')
            .select(
              `
              producto_id, 
              cantidad,
              ventas!inner(tenant_id)
            `
            )
            .eq('venta_id', id)
            .eq('ventas.tenant_id', tenantId);

        if (detallesError) throw detallesError;

        // 3. Restaurar stock de productos anteriores
        for (const detalle of detallesAnteriores || []) {
          const { data: productoActual, error: getError } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', detalle.producto_id)
            .eq('tenant_id', tenantId)
            .single();

          if (getError) throw getError;

          const stockRestaurado = productoActual.stock + detalle.cantidad;

          const { error: stockError } = await supabase
            .from('productos')
            .update({
              stock: stockRestaurado,
              updated_at: new Date().toISOString(),
            })
            .eq('id', detalle.producto_id)
            .eq('tenant_id', tenantId);

          if (stockError) throw stockError;
        }

        // 4. Eliminar detalles anteriores (verificando que la venta pertenezca al tenant)
        const { data: ventaVerificacion, error: verificacionError } =
          await supabase
            .from('ventas')
            .select('id')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .single();

        if (verificacionError || !ventaVerificacion) {
          throw new Error(
            'Venta no encontrada o no pertenece al tenant actual'
          );
        }

        const { error: deleteDetallesError } = await supabase
          .from('detalle_ventas')
          .delete()
          .eq('venta_id', id);

        if (deleteDetallesError) throw deleteDetallesError;

        // 5. Insertar nuevos detalles
        const ventaProductos = productos.map((producto) => ({
          venta_id: id,
          producto_id: producto.id,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio,
          tenant_id: tenantId,
        }));

        const { error: productosError } = await supabase
          .from('detalle_ventas')
          .insert(ventaProductos);

        if (productosError) throw productosError;

        // 6. Actualizar stock con nuevos productos
        for (const producto of productos) {
          const { data: productoActual, error: getError } = await supabase
            .from('productos')
            .select('stock')
            .eq('id', producto.id)
            .eq('tenant_id', tenantId)
            .single();

          if (getError) throw getError;

          const nuevoStock = productoActual.stock - producto.cantidad;

          const { error: stockError } = await supabase
            .from('productos')
            .update({
              stock: nuevoStock,
              updated_at: new Date().toISOString(),
            })
            .eq('id', producto.id)
            .eq('tenant_id', tenantId);

          if (stockError) throw stockError;
        }

        return { data: null, error: null };
      } catch (error) {
        console.error('Error in updateVenta:', error);
        return { data: null, error };
      }
    },
    [getCurrentTenantId]
  );

  const deleteVenta = useCallback(
    async (id) => {
      const tenantId = getCurrentTenantId();

      if (!tenantId) {
        throw new Error('No hay tenant activo');
      }

      try {
        // Primero eliminar los detalles de la venta (por CASCADE debería eliminarse automáticamente)
        const { error: deleteError } = await supabase
          .from('ventas')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);

        if (deleteError) throw deleteError;

        return { data: null, error: null };
      } catch (error) {
        console.error('Error in deleteVenta:', error);
        return { data: null, error };
      }
    },
    [getCurrentTenantId]
  );

  // Reportes
  const getReportesVentas = useCallback(
    (fechaInicio, fechaFin) => {
      const tenantId = getCurrentTenantId();
      return supabase.rpc('reporte_ventas', {
        p_tenant_id: tenantId,
        p_fecha_inicio: fechaInicio,
        p_fecha_fin: fechaFin,
      });
    },
    [getCurrentTenantId]
  );

  const getProductosMasVendidos = useCallback(
    (limite = 10) => {
      const tenantId = getCurrentTenantId();
      return supabase.rpc('productos_mas_vendidos', {
        p_tenant_id: tenantId,
        p_limite: limite,
      });
    },
    [getCurrentTenantId]
  );

  const getProductosStockBajo = useCallback(
    (umbral = 5) => {
      const tenantId = getCurrentTenantId();
      return supabase
        .from('productos')
        .select('*')
        .eq('tenant_id', tenantId)
        .lte('stock', umbral)
        .order('stock', { ascending: true });
    },
    [getCurrentTenantId]
  );

  const getVentasHoy = useCallback(() => {
    const tenantId = getCurrentTenantId();
    const hoy = new Date().toISOString().split('T')[0];
    return supabase
      .from('ventas')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('fecha', hoy)
      .order('created_at', { ascending: false });
  }, [getCurrentTenantId]);

  const getVentasSemana = useCallback(() => {
    const tenantId = getCurrentTenantId();
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const fechaInicio = hace7Dias.toISOString().split('T')[0];

    return supabase
      .from('ventas')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('fecha', fechaInicio)
      .order('created_at', { ascending: false });
  }, [getCurrentTenantId]);

  const getVentasMes = useCallback(() => {
    const tenantId = getCurrentTenantId();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const fechaInicio = hace30Dias.toISOString().split('T')[0];

    return supabase
      .from('ventas')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('fecha', fechaInicio)
      .order('created_at', { ascending: false });
  }, [getCurrentTenantId]);

  return {
    // Queries base
    createTenantQuery,

    // Categorías
    getCategorias,
    insertCategoria,
    updateCategoria,
    deleteCategoria,

    // Productos
    getProductos,
    insertProducto,
    updateProducto,
    deleteProducto,
    updateStock,
    getProductosStockBajo,

    // Ventas
    getVentas,
    insertVenta,
    updateVenta,
    deleteVenta,
    getVentasHoy,
    getVentasSemana,
    getVentasMes,

    // Reportes
    getReportesVentas,
    getProductosMasVendidos,
  };
};
