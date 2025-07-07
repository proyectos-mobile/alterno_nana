import { useFocusEffect } from '@react-navigation/native';
import { Calendar, DollarSign, Plus, Search, ShoppingCart } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import SaleForm from '../../components/SaleForm';
import { supabase } from '../../lib/supabase';

export default function VentasScreen() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadVentas();
    }, [])
  );

  const loadVentas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          detalle_ventas (
            *,
            productos (
              nombre
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setVentas(data || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVentas();
    setRefreshing(false);
  };

  const handleFormSave = () => {
    loadVentas();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredVentas = ventas.filter(venta => {
    const searchLower = searchQuery.toLowerCase();
    const fecha = formatDate(venta.fecha).includes(searchLower);
    const productos = venta.detalle_ventas.some(detalle => 
      detalle.productos?.nombre.toLowerCase().includes(searchLower)
    );
    return fecha || productos;
  });

  const renderVenta = ({ item }) => (
    <View style={styles.ventaCard}>
      <View style={styles.ventaHeader}>
        <View style={styles.ventaInfo}>
          <Text style={styles.ventaId}>Venta #{item.id.slice(-8)}</Text>
          <View style={styles.ventaDateContainer}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.ventaDate}>
              {formatDate(item.fecha)} - {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
        <Text style={styles.ventaTotal}>${item.total}</Text>
      </View>
      
      <View style={styles.ventaProductos}>
        <Text style={styles.productosTitle}>Productos:</Text>
        {item.detalle_ventas.map((detalle, index) => (
          <Text key={index} style={styles.productoItem}>
            • {detalle.productos?.nombre} x{detalle.cantidad} 
            (${detalle.precio_unitario} c/u)
          </Text>
        ))}
      </View>
    </View>
  );

  const renderHeader = () => {
    const totalVentasHoy = ventas.filter(venta => 
      venta.fecha === new Date().toISOString().split('T')[0]
    ).reduce((sum, venta) => sum + venta.total, 0);

    return (
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ShoppingCart size={28} color="#059669" />
          <Text style={styles.title}>Ventas</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por fecha o producto..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Nueva Venta</Text>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <DollarSign size={20} color="#059669" />
            <Text style={styles.statValue}>${totalVentasHoy.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Ventas Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <ShoppingCart size={20} color="#2563EB" />
            <Text style={styles.statValue}>{filteredVentas.length}</Text>
            <Text style={styles.statLabel}>Total Ventas</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ShoppingCart size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No hay ventas</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? 'No se encontraron ventas que coincidan con tu búsqueda' 
                     : 'Comienza registrando tu primera venta'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
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

      <SaleForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleFormSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
    paddingLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
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
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  ventaCard: {
    backgroundColor: '#ffffff',
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
    borderColor: '#f3f4f6',
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
    color: '#111827',
    marginBottom: 4,
  },
  ventaDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ventaDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  ventaTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#059669',
  },
  ventaProductos: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  productosTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  productoItem: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});