import { useFocusEffect } from '@react-navigation/native';
import {
  Calendar,
  DollarSign,
  Edit,
  Plus,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EditVentaForm from '../../components/EditVentaForm';
import SaleForm from '../../components/SaleForm';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function VentasScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  const loadVentas = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ventas')
        .select(
          `
          *,
          detalle_ventas (
            *,
            productos (
              nombre
            )
          )
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVentas(data || []);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('sales.loadError') + ': ' + error.message
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadVentas();
    }, [loadVentas])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVentas();
    setRefreshing(false);
  };

  const handleFormSave = () => {
    loadVentas();
  };

  const handleEditVenta = useCallback((venta) => {
    setSelectedVenta(venta);
    setShowEditForm(true);
  }, []);

  const handleDeleteVenta = useCallback(
    async (ventaId) => {
      Alert.alert(t('common.confirm'), t('sales.deleteConfirm'), [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // PASO 1: Obtener los detalles de la venta para restaurar el stock
              const { data: detallesVenta, error: detallesError } =
                await supabase
                  .from('detalle_ventas')
                  .select('producto_id, cantidad')
                  .eq('venta_id', ventaId);

              if (detallesError) throw detallesError;

              // PASO 2: Restaurar el stock de los productos
              for (const detalle of detallesVenta) {
                // Obtener el stock actual
                const { data: productoActual, error: getError } = await supabase
                  .from('productos')
                  .select('stock')
                  .eq('id', detalle.producto_id)
                  .single();

                if (getError) throw getError;

                // Restaurar el stock
                const { error: stockError } = await supabase
                  .from('productos')
                  .update({
                    stock: productoActual.stock + detalle.cantidad,
                  })
                  .eq('id', detalle.producto_id);

                if (stockError) throw stockError;
              }

              // PASO 3: Eliminar los detalles de venta
              const { error: deleteDetallesError } = await supabase
                .from('detalle_ventas')
                .delete()
                .eq('venta_id', ventaId);

              if (deleteDetallesError) throw deleteDetallesError;

              // PASO 4: Eliminar la venta
              const { error: ventaError } = await supabase
                .from('ventas')
                .delete()
                .eq('id', ventaId);

              if (ventaError) throw ventaError;

              Alert.alert(t('common.success'), t('sales.deleteSuccess'));
              loadVentas();
            } catch (error) {
              Alert.alert(
                t('common.error'),
                t('sales.deleteError') + ': ' + error.message
              );
            }
          },
        },
      ]);
    },
    [loadVentas, t]
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredVentas = ventas.filter((venta) => {
    const searchLower = searchQuery.toLowerCase();
    const fecha = formatDate(venta.fecha).includes(searchLower);
    const productos = venta.detalle_ventas.some((detalle) =>
      detalle.productos?.nombre.toLowerCase().includes(searchLower)
    );
    return fecha || productos;
  });

  const renderVenta = ({ item }) => (
    <View
      style={[
        styles.ventaCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
        },
      ]}
    >
      <View style={styles.ventaHeader}>
        <View style={styles.ventaInfo}>
          <Text style={[styles.ventaId, { color: colors.text }]}>
            {t('sales.title')} #{item.id.slice(-8)}
          </Text>
          <View style={styles.ventaDateContainer}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={[styles.ventaDate, { color: colors.textSecondary }]}>
              {formatDate(item.fecha)} - {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
        <View style={styles.ventaActions}>
          <Text style={[styles.ventaTotal, { color: colors.success }]}>
            ${item.total}
          </Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleEditVenta(item)}
            >
              <Edit size={16} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleDeleteVenta(item.id)}
            >
              <X size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View
        style={[styles.ventaProductos, { borderTopColor: colors.borderLight }]}
      >
        <Text style={[styles.productosTitle, { color: colors.text }]}>
          Productos:
        </Text>
        {item.detalle_ventas.map((detalle) => (
          <Text
            key={`${item.id}-${detalle.producto_id}`}
            style={[styles.productoItem, { color: colors.textSecondary }]}
          >
            • {detalle.productos?.nombre} x{detalle.cantidad}
            (${detalle.precio_unitario} c/u)
          </Text>
        ))}
      </View>
    </View>
  );

  const renderHeader = useCallback(() => {
    const totalVentasHoy = ventas
      .filter((venta) => venta.fecha === new Date().toISOString().split('T')[0])
      .reduce((sum, venta) => sum + venta.total, 0);

    return (
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowForm(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>{t('sales.newSale')}</Text>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <DollarSign size={20} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              ${totalVentasHoy.toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('sales.todaySales')}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <ShoppingCart size={20} color={colors.secondary} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {filteredVentas.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('sales.totalSales')}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [ventas, filteredVentas, colors, t]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ShoppingCart size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t('sales.noSales')}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        {searchQuery ? t('sales.noSearchResults') : t('sales.firstSaleMessage')}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.searchSection,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.titleContainer}>
          <ShoppingCart size={28} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('sales.title')}
          </Text>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('sales.searchPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      <FlatList
        data={filteredVentas}
        renderItem={renderVenta}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {loading && (
        <View
          style={[styles.loadingOverlay, { backgroundColor: colors.overlay }]}
        >
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      )}

      <SaleForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleFormSave}
      />

      <EditVentaForm
        visible={showEditForm}
        onClose={() => setShowEditForm(false)}
        venta={selectedVenta}
        onSave={handleFormSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  header: {
    padding: 20,
    marginBottom: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  ventaCard: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
  },
  ventaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ventaInfo: {
    flex: 1,
  },
  ventaId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ventaDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ventaDate: {
    fontSize: 14,
  },
  ventaActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
  },
  ventaTotal: {
    fontSize: 24,
    fontWeight: '700',
  },
  ventaProductos: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  productosTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  productoItem: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
