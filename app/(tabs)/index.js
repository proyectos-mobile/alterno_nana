import { useFocusEffect } from '@react-navigation/native';
import { Package, Plus, Search } from 'lucide-react-native';
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
import ProductCard from '../../components/ProductCard';
import ProductForm from '../../components/ProductForm';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

export default function ProductsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const insets = useSafeAreaInsets();

  const loadProductos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
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
        .order('nombre');

      if (error) throw error;

      const productosConCategoria = data.map((producto) => ({
        ...producto,
        categoria_nombre: producto.categorias?.nombre || 'Sin categoría',
      }));

      setProductos(productosConCategoria);
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudieron cargar los productos: ' + error.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProductos();
    }, [loadProductos])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProductos();
    setRefreshing(false);
  };

  const handleEdit = useCallback((product) => {
    setSelectedProduct(product);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (productId) => {
      try {
        const { error } = await supabase
          .from('productos')
          .delete()
          .eq('id', productId);

        if (error) throw error;

        Alert.alert('Éxito', 'Producto eliminado correctamente');
        loadProductos();
      } catch (error) {
        Alert.alert(
          'Error',
          'No se pudo eliminar el producto: ' + error.message
        );
      }
    },
    [loadProductos]
  );

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedProduct(null);
  };

  const handleFormSave = () => {
    loadProductos();
  };

  const filteredProductos = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      producto.categoria_nombre
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const renderProduct = useCallback(
    ({ item }) => (
      <ProductCard product={item} onEdit={handleEdit} onDelete={handleDelete} />
    ),
    [handleEdit, handleDelete]
  );

  const renderHeader = useCallback(
    () => (
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowForm(true)}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>{t('products.newProduct')}</Text>
        </TouchableOpacity>

        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            {t('products.totalProducts')}: {filteredProductos.length}
          </Text>
          <Text style={[styles.lowStockText, { color: colors.danger }]}>
            {t('products.lowStock')}:{' '}
            {filteredProductos.filter((p) => p.stock <= 10).length}
          </Text>
        </View>
      </View>
    ),
    [filteredProductos, colors, t]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Package size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No hay productos
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {searchQuery
            ? 'No se encontraron productos que coincidan con tu búsqueda'
            : 'Comienza agregando tu primer producto'}
        </Text>
      </View>
    ),
    [searchQuery, colors]
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
          <Package size={28} color={colors.secondary} />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('products.title')}
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
            placeholder={t('products.searchProducts')}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

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

      {loading && (
        <View
          style={[styles.loadingOverlay, { backgroundColor: colors.overlay }]}
        >
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('products.loadingProducts')}
          </Text>
        </View>
      )}

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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lowStockText: {
    fontSize: 14,
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
