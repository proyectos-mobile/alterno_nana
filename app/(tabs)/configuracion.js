import { useFocusEffect } from '@react-navigation/native';
import { ChartBar as BarChart3, CreditCard as Edit3, Package, Plus, Settings, Tag, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import CategoryForm from '../../components/CategoryForm';
import { supabase } from '../../lib/supabase';

export default function ConfiguracionScreen() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stats, setStats] = useState({
    totalCategorias: 0,
    totalProductos: 0,
    totalVentas: 0
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCategorias(),
        loadStats()
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select(`
          *,
          productos (count)
        `)
        .order('nombre');
      
      if (error) throw error;
      
      const categoriasConConteo = data.map(categoria => ({
        ...categoria,
        productosCount: categoria.productos[0]?.count || 0
      }));
      
      setCategorias(categoriasConConteo);
    } catch (error) {
      console.error('Error loading categorias:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [categoriasResult, productosResult, ventasResult] = await Promise.all([
        supabase.from('categorias').select('*', { count: 'exact', head: true }),
        supabase.from('productos').select('*', { count: 'exact', head: true }),
        supabase.from('ventas').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalCategorias: categoriasResult.count || 0,
        totalProductos: productosResult.count || 0,
        totalVentas: ventasResult.count || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId, productosCount) => {
    if (productosCount > 0) {
      Alert.alert(
        'No se puede eliminar',
        'Esta categoría tiene productos asociados. Elimina o reasigna los productos primero.'
      );
      return;
    }

    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar esta categoría?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('categorias')
                .delete()
                .eq('id', categoryId);
              
              if (error) throw error;
              
              Alert.alert('Éxito', 'Categoría eliminada correctamente');
              loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la categoría: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleCategoryFormClose = () => {
    setShowCategoryForm(false);
    setSelectedCategory(null);
  };

  const handleCategoryFormSave = () => {
    loadData();
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Resumen General</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Tag size={24} color="#7C3AED" />
          <Text style={styles.statValue}>{stats.totalCategorias}</Text>
          <Text style={styles.statLabel}>Categorías</Text>
        </View>
        <View style={styles.statItem}>
          <Package size={24} color="#2563EB" />
          <Text style={styles.statValue}>{stats.totalProductos}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
        <View style={styles.statItem}>
          <BarChart3 size={24} color="#059669" />
          <Text style={styles.statValue}>{stats.totalVentas}</Text>
          <Text style={styles.statLabel}>Ventas</Text>
        </View>
      </View>
    </View>
  );

  const renderCategoryItem = ({ item }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.nombre}</Text>
        <Text style={styles.categoryDescription}>{item.descripcion}</Text>
        <Text style={styles.categoryCount}>
          {item.productosCount} producto{item.productosCount !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.categoryActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleEditCategory(item)}
        >
          <Edit3 size={16} color="#059669" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleDeleteCategory(item.id, item.productosCount)}
        >
          <Trash2 size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoriesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gestión de Categorías</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCategoryForm(true)}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addButtonText}>Nueva</Text>
        </TouchableOpacity>
      </View>
      
      {categorias.length > 0 ? (
        <FlatList
          data={categorias}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Tag size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No hay categorías</Text>
          <Text style={styles.emptyText}>
            Comienza creando tu primera categoría
          </Text>
        </View>
      )}
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
            <Settings size={28} color="#6B46C1" />
            <Text style={styles.title}>Configuración</Text>
          </View>
          <Text style={styles.subtitle}>
            Gestiona categorías y configuraciones del sistema
          </Text>
        </View>

        {renderStatsCard()}
        {renderCategoriesSection()}
      </ScrollView>

      <CategoryForm
        visible={showCategoryForm}
        onClose={handleCategoryFormClose}
        category={selectedCategory}
        onSave={handleCategoryFormSave}
      />
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
  statsCard: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});