import { useFocusEffect } from '@react-navigation/native';
import { Package, Plus, Search } from 'lucide-react-native';
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
import ProductCard from '../../components/ProductCard';
import ProductForm from '../../components/ProductForm';
import { supabase } from '../../lib/supabase';

export default function ProductsScreen() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadProductos();
    }, [])
  );

  const loadProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          categorias (
            id,
            nombre
          )
        `)
        .order('nombre');
      
      if (error) throw error;
      
      const productosConCategoria = data.map(producto => ({
        ...producto,
        categoria_nombre: producto.categorias?.nombre || 'Sin categoría'
      }));
      
      setProductos(productosConCategoria);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProductos();
    setRefreshing(false);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      Alert.alert('Éxito', 'Producto eliminado correctamente');
      loadProductos();
    } catch (error) {
      Alert.alert('Error', 'No se pudo eliminar el producto: ' + error.message);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedProduct(null);
  };

  const handleFormSave = () => {
    loadProductos();
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    producto.categoria_nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Package size={28} color="#2563EB" />
        <Text style={styles.title}>Productos</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Search size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
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
        <Text style={styles.addButtonText}>Nuevo Producto</Text>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Total: {filteredProductos.length} productos
        </Text>
        <Text style={styles.lowStockText}>
          Stock bajo: {filteredProductos.filter(p => p.stock <= 10).length} productos
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Package size={64} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No hay productos</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? 'No se encontraron productos que coincidan con tu búsqueda' 
                     : 'Comienza agregando tu primer producto'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProductos}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      <ProductForm
        visible={showForm}
        onClose={handleFormClose}
        product={selectedProduct}
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
    backgroundColor: '#2563EB',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  lowStockText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
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