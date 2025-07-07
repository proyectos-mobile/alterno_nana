import { useFocusEffect } from '@react-navigation/native';
import { TriangleAlert as AlertTriangle, ChartBar as BarChart3, DollarSign, Package, TrendingUp } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ReportesScreen() {
  const [reportes, setReportes] = useState({
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    productosMasVendidos: [],
    productosStockBajo: [],
    totalProductos: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadReportes();
    }, [])
  );

  const loadReportes = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadVentasPorPeriodo(),
        loadProductosMasVendidos(),
        loadProductosStockBajo(),
        loadTotalProductos()
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const loadVentasPorPeriodo = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const mesAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Ventas de hoy
      const { data: ventasHoy, error: errorHoy } = await supabase
        .from('ventas')
        .select('total')
        .eq('fecha', hoy);

      if (errorHoy) throw errorHoy;

      // Ventas de la semana
      const { data: ventasSemana, error: errorSemana } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', semanaAtras);

      if (errorSemana) throw errorSemana;

      // Ventas del mes
      const { data: ventasMes, error: errorMes } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', mesAtras);

      if (errorMes) throw errorMes;

      setReportes(prev => ({
        ...prev,
        ventasHoy: ventasHoy.reduce((sum, venta) => sum + venta.total, 0),
        ventasSemana: ventasSemana.reduce((sum, venta) => sum + venta.total, 0),
        ventasMes: ventasMes.reduce((sum, venta) => sum + venta.total, 0)
      }));
    } catch (error) {
      console.error('Error loading ventas por periodo:', error);
    }
  };

  const loadProductosMasVendidos = async () => {
    try {
      const { data, error } = await supabase
        .from('detalle_ventas')
        .select(`
          producto_id,
          cantidad,
          productos (
            nombre,
            precio
          )
        `);

      if (error) throw error;

      const productosVendidos = {};
      data.forEach(detalle => {
        const id = detalle.producto_id;
        if (!productosVendidos[id]) {
          productosVendidos[id] = {
            id,
            nombre: detalle.productos?.nombre || 'Producto eliminado',
            precio: detalle.productos?.precio || 0,
            totalVendido: 0
          };
        }
        productosVendidos[id].totalVendido += detalle.cantidad;
      });

      const masVendidos = Object.values(productosVendidos)
        .sort((a, b) => b.totalVendido - a.totalVendido)
        .slice(0, 5);

      setReportes(prev => ({
        ...prev,
        productosMasVendidos: masVendidos
      }));
    } catch (error) {
      console.error('Error loading productos mas vendidos:', error);
    }
  };

  const loadProductosStockBajo = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          categorias (
            nombre
          )
        `)
        .lte('stock', 10)
        .order('stock');

      if (error) throw error;

      setReportes(prev => ({
        ...prev,
        productosStockBajo: data || []
      }));
    } catch (error) {
      console.error('Error loading productos stock bajo:', error);
    }
  };

  const loadTotalProductos = async () => {
    try {
      const { count, error } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;

      setReportes(prev => ({
        ...prev,
        totalProductos: count || 0
      }));
    } catch (error) {
      console.error('Error loading total productos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportes();
    setRefreshing(false);
  };

  const renderVentasCard = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <DollarSign size={24} color="#059669" />
        <Text style={styles.cardTitle}>Resumen de Ventas</Text>
      </View>
      <View style={styles.ventasStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${reportes.ventasHoy.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${reportes.ventasSemana.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Esta Semana</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${reportes.ventasMes.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Este Mes</Text>
        </View>
      </View>
    </View>
  );

  const renderProductosMasVendidos = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TrendingUp size={24} color="#2563EB" />
        <Text style={styles.cardTitle}>Productos Más Vendidos</Text>
      </View>
      {reportes.productosMasVendidos.length > 0 ? (
        reportes.productosMasVendidos.map((producto, index) => (
          <View key={producto.id} style={styles.productoItem}>
            <View style={styles.ranking}>
              <Text style={styles.rankingNumber}>{index + 1}</Text>
            </View>
            <View style={styles.productoInfo}>
              <Text style={styles.productoNombre}>{producto.nombre}</Text>
              <Text style={styles.productoStats}>
                {producto.totalVendido} unidades vendidas
              </Text>
            </View>
            <Text style={styles.productoPrecio}>${producto.precio}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No hay datos de ventas disponibles</Text>
      )}
    </View>
  );

  const renderProductosStockBajo = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <AlertTriangle size={24} color="#EA580C" />
        <Text style={styles.cardTitle}>Productos con Stock Bajo</Text>
      </View>
      {reportes.productosStockBajo.length > 0 ? (
        reportes.productosStockBajo.map((producto) => (
          <View key={producto.id} style={styles.stockItem}>
            <View style={styles.productoInfo}>
              <Text style={styles.productoNombre}>{producto.nombre}</Text>
              <Text style={styles.categoriaText}>{producto.categorias?.nombre}</Text>
            </View>
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>{producto.stock}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>Todos los productos tienen stock suficiente</Text>
      )}
    </View>
  );

  const renderEstadisticasGenerales = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Package size={24} color="#7C3AED" />
        <Text style={styles.cardTitle}>Estadísticas Generales</Text>
      </View>
      <View style={styles.generalStats}>
        <View style={styles.generalStatItem}>
          <Text style={styles.generalStatValue}>{reportes.totalProductos}</Text>
          <Text style={styles.generalStatLabel}>Total de Productos</Text>
        </View>
        <View style={styles.generalStatItem}>
          <Text style={styles.generalStatValue}>{reportes.productosStockBajo.length}</Text>
          <Text style={styles.generalStatLabel}>Con Stock Bajo</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <BarChart3 size={28} color="#7C3AED" />
            <Text style={styles.title}>Reportes</Text>
          </View>
          <Text style={styles.subtitle}>
            Análisis y estadísticas de tu papelería
          </Text>
        </View>

        {renderVentasCard()}
        {renderProductosMasVendidos()}
        {renderProductosStockBajo()}
        {renderEstadisticasGenerales()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  ventasStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  productoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ranking: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankingNumber: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  productoStats: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  productoPrecio: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoriaText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  stockBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  stockText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  generalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  generalStatItem: {
    alignItems: 'center',
  },
  generalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#7C3AED',
  },
  generalStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});