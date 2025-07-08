import { useFocusEffect } from '@react-navigation/native';
import {
  TriangleAlert as AlertTriangle,
  ChartBar as BarChart3,
  DollarSign,
  Package,
  TrendingUp,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function ReportesScreen() {
  const { colors } = useTheme();
  const [reportes, setReportes] = useState({
    ventasHoy: 0,
    ventasSemana: 0,
    ventasMes: 0,
    productosMasVendidos: [],
    productosStockBajo: [],
    totalProductos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReportes = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar ventas por período
      const hoy = new Date().toISOString().split('T')[0];
      const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const mesAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const [
        ventasHoyData,
        ventasSemanaData,
        ventasMesData,
        detalleVentasData,
        stockBajoData,
        totalProductosData,
      ] = await Promise.all([
        supabase.from('ventas').select('total').eq('fecha', hoy),
        supabase.from('ventas').select('total').gte('fecha', semanaAtras),
        supabase.from('ventas').select('total').gte('fecha', mesAtras),
        supabase.from('detalle_ventas').select(`
          producto_id,
          cantidad,
          productos (
            nombre,
            precio
          )
        `),
        supabase
          .from('productos')
          .select(
            `
          *,
          categorias (
            nombre
          )
        `
          )
          .lte('stock', 10)
          .order('stock'),
        supabase.from('productos').select('*', { count: 'exact', head: true }),
      ]);

      // Procesar ventas por período
      const ventasHoy = (ventasHoyData.data || []).reduce(
        (sum, venta) => sum + venta.total,
        0
      );
      const ventasSemana = (ventasSemanaData.data || []).reduce(
        (sum, venta) => sum + venta.total,
        0
      );
      const ventasMes = (ventasMesData.data || []).reduce(
        (sum, venta) => sum + venta.total,
        0
      );

      // Procesar productos más vendidos
      const productosVendidos = {};
      (detalleVentasData.data || []).forEach((detalle) => {
        const id = detalle.producto_id;
        if (!productosVendidos[id]) {
          productosVendidos[id] = {
            id,
            nombre: detalle.productos?.nombre || 'Producto eliminado',
            precio: detalle.productos?.precio || 0,
            totalVendido: 0,
          };
        }
        productosVendidos[id].totalVendido += detalle.cantidad;
      });

      const masVendidos = Object.values(productosVendidos)
        .sort((a, b) => b.totalVendido - a.totalVendido)
        .slice(0, 5);

      setReportes({
        ventasHoy,
        ventasSemana,
        ventasMes,
        productosMasVendidos: masVendidos,
        productosStockBajo: stockBajoData.data || [],
        totalProductos: totalProductosData.count || 0,
      });
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudieron cargar los reportes: ' + error.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReportes();
    }, [loadReportes])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReportes();
    setRefreshing(false);
  };

  const renderVentasCard = () => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <DollarSign size={24} color={colors.success} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Resumen de Ventas
        </Text>
      </View>
      <View style={styles.ventasStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            ${reportes.ventasHoy.toFixed(2)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Hoy
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            ${reportes.ventasSemana.toFixed(2)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Esta Semana
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            ${reportes.ventasMes.toFixed(2)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Este Mes
          </Text>
        </View>
      </View>
    </View>
  );

  const renderProductosMasVendidos = () => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <TrendingUp size={24} color={colors.secondary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Productos Más Vendidos
        </Text>
      </View>
      {reportes.productosMasVendidos.length > 0 ? (
        reportes.productosMasVendidos.map((producto, index) => (
          <View
            key={producto.id}
            style={[
              styles.productoItem,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={[styles.ranking, { backgroundColor: colors.primary }]}>
              <Text style={styles.rankingNumber}>{index + 1}</Text>
            </View>
            <View style={styles.productoInfo}>
              <Text style={[styles.productoNombre, { color: colors.text }]}>
                {producto.nombre}
              </Text>
              <Text
                style={[styles.productoStats, { color: colors.textSecondary }]}
              >
                {producto.totalVendido} unidades vendidas
              </Text>
            </View>
            <Text style={[styles.productoPrecio, { color: colors.success }]}>
              ${producto.precio}
            </Text>
          </View>
        ))
      ) : (
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          No hay datos de ventas disponibles
        </Text>
      )}
    </View>
  );

  const renderProductosStockBajo = () => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <AlertTriangle size={24} color={colors.warning} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Productos con Stock Bajo
        </Text>
      </View>
      {reportes.productosStockBajo.length > 0 ? (
        reportes.productosStockBajo.map((producto) => (
          <View
            key={producto.id}
            style={[
              styles.stockItem,
              { borderBottomColor: colors.borderLight },
            ]}
          >
            <View style={styles.productoInfo}>
              <Text style={[styles.productoNombre, { color: colors.text }]}>
                {producto.nombre}
              </Text>
              <Text
                style={[styles.categoriaText, { color: colors.textTertiary }]}
              >
                {producto.categorias?.nombre}
              </Text>
            </View>
            <View
              style={[
                styles.stockBadge,
                {
                  backgroundColor: colors.danger + '20',
                  borderColor: colors.danger + '40',
                },
              ]}
            >
              <Text style={[styles.stockText, { color: colors.danger }]}>
                {producto.stock}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          Todos los productos tienen stock suficiente
        </Text>
      )}
    </View>
  );

  const renderEstadisticasGenerales = () => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <Package size={24} color="#7C3AED" />
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Estadísticas Generales
        </Text>
      </View>
      <View style={styles.generalStats}>
        <View style={styles.generalStatItem}>
          <Text style={[styles.generalStatValue, { color: colors.text }]}>
            {reportes.totalProductos}
          </Text>
          <Text
            style={[styles.generalStatLabel, { color: colors.textSecondary }]}
          >
            Total de Productos
          </Text>
        </View>
        <View style={styles.generalStatItem}>
          <Text style={[styles.generalStatValue, { color: colors.text }]}>
            {reportes.productosStockBajo.length}
          </Text>
          <Text
            style={[styles.generalStatLabel, { color: colors.textSecondary }]}
          >
            Con Stock Bajo
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Cargando reportes...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <View style={styles.titleContainer}>
              <BarChart3 size={28} color="#7C3AED" />
              <Text style={[styles.title, { color: colors.text }]}>
                Reportes
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Análisis y estadísticas de tu papelería
            </Text>
          </View>

          {renderVentasCard()}
          {renderProductosMasVendidos()}
          {renderProductosStockBajo()}
          {renderEstadisticasGenerales()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  header: {
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
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
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
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  productoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  ranking: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },
  productoStats: {
    fontSize: 12,
    marginTop: 2,
  },
  productoPrecio: {
    fontSize: 16,
    fontWeight: '600',
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoriaText: {
    fontSize: 12,
    marginTop: 2,
  },
  stockBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  stockText: {
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
  },
  generalStatLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
