import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CreditCard as Edit3, Trash2, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function ProductCard({ product, onEdit, onDelete }) {
  const isLowStock = product.stock <= 10;

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar "${product.nombre}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(product.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.card, isLowStock && styles.lowStockCard]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{product.nombre}</Text>
          {isLowStock && (
            <View style={styles.warningContainer}>
              <AlertTriangle size={16} color="#EA580C" />
              <Text style={styles.warningText}>Stock Bajo</Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => onEdit(product)}
          >
            <Edit3 size={16} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleDelete}
          >
            <Trash2 size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.description}>{product.descripcion}</Text>
      <Text style={styles.category}>Categoría: {product.categoria_nombre}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.price}>${product.precio}</Text>
        <Text style={[styles.stock, isLowStock && styles.lowStock]}>
          Stock: {product.stock}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
  lowStockCard: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '500',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f9fafb',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
  },
  stock: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  lowStock: {
    color: '#DC2626',
    fontWeight: '600',
  },
});