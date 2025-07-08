import {
  Minus,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function SaleForm({ visible, onClose, onSave }) {
  const [productos, setProductos] = useState([]);
  const [carritoItems, setCarritoItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  const loadProductos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(
          `
          *,
          categorias (
            nombre
          )
        `
        )
        .gt('stock', 0)
        .order('nombre');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudieron cargar los productos: ' + error.message
      );
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadProductos();
      setCarritoItems([]);
      setSearchQuery('');
    }
  }, [visible, loadProductos]);

  const agregarAlCarrito = useCallback((producto) => {
    setCarritoItems((prev) => {
      const existingItem = prev.find((item) => item.id === producto.id);
      if (existingItem) {
        if (existingItem.cantidad >= producto.stock) {
          Alert.alert(
            'Stock insuficiente',
            `Solo hay ${producto.stock} unidades disponibles`
          );
          return prev;
        }
        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prev, { ...producto, cantidad: 1 }];
      }
    });
  }, []);

  const eliminarDelCarrito = useCallback((productoId) => {
    setCarritoItems((prev) => prev.filter((item) => item.id !== productoId));
  }, []);

  const actualizarCantidad = useCallback(
    (productoId, nuevaCantidad) => {
      if (nuevaCantidad <= 0) {
        eliminarDelCarrito(productoId);
        return;
      }

      const producto = productos.find((p) => p.id === productoId);
      if (nuevaCantidad > producto.stock) {
        Alert.alert(
          'Stock insuficiente',
          `Solo hay ${producto.stock} unidades disponibles`
        );
        return;
      }

      setCarritoItems((prev) =>
        prev.map((item) =>
          item.id === productoId ? { ...item, cantidad: nuevaCantidad } : item
        )
      );
    },
    [productos, eliminarDelCarrito]
  );

  const calcularTotal = () => {
    return carritoItems.reduce(
      (total, item) => total + item.precio * item.cantidad,
      0
    );
  };

  const procesarVenta = async () => {
    if (carritoItems.length === 0) {
      Alert.alert('Error', 'Agrega al menos un producto al carrito');
      return;
    }

    setLoading(true);

    try {
      // Crear la venta
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert([
          {
            fecha: new Date().toISOString().split('T')[0],
            total: calcularTotal(),
          },
        ])
        .select()
        .single();

      if (ventaError) throw ventaError;

      // Crear los detalles de venta
      const detalles = carritoItems.map((item) => ({
        venta_id: venta.id,
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
      }));

      const { error: detallesError } = await supabase
        .from('detalle_ventas')
        .insert(detalles);

      if (detallesError) throw detallesError;

      // Actualizar stock de productos
      for (const item of carritoItems) {
        const { error: stockError } = await supabase
          .from('productos')
          .update({ stock: item.stock - item.cantidad })
          .eq('id', item.id);

        if (stockError) throw stockError;
      }

      Alert.alert('Éxito', 'Venta registrada correctamente');
      onSave();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la venta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProductos = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProducto = useCallback(
    ({ item }) => {
      const enCarrito = carritoItems.find((carrito) => carrito.id === item.id);

      return (
        <TouchableOpacity
          style={[styles.productCard, enCarrito && styles.productCardSelected]}
          onPress={() => agregarAlCarrito(item)}
        >
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.nombre}</Text>
            <Text style={styles.productCategory}>
              {item.categorias?.nombre}
            </Text>
            <Text style={styles.productPrice}>${item.precio}</Text>
            <Text style={styles.productStock}>Stock: {item.stock}</Text>
          </View>
          {enCarrito && (
            <View style={styles.cantidadBadge}>
              <Text style={styles.cantidadBadgeText}>{enCarrito.cantidad}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [carritoItems, agregarAlCarrito]
  );

  const renderCarritoItem = useCallback(
    ({ item }) => (
      <View style={styles.carritoItem}>
        <View style={styles.carritoInfo}>
          <Text style={styles.carritoName}>{item.nombre}</Text>
          <Text style={styles.carritoPrice}>
            ${item.precio} x {item.cantidad}
          </Text>
          <Text style={styles.carritoSubtotal}>
            ${(item.precio * item.cantidad).toFixed(2)}
          </Text>
        </View>
        <View style={styles.carritoControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => actualizarCantidad(item.id, item.cantidad - 1)}
          >
            <Minus size={16} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.cantidadText}>{item.cantidad}</Text>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => actualizarCantidad(item.id, item.cantidad + 1)}
          >
            <Plus size={16} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => eliminarDelCarrito(item.id)}
          >
            <Trash2 size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [actualizarCantidad, eliminarDelCarrito]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <View style={styles.titleContainer}>
            <ShoppingCart size={24} color="#2563EB" />
            <Text style={styles.title}>Nueva Venta</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Text style={styles.sectionTitle}>Productos Disponibles</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.productosSection}>
            <FlatList
              data={filteredProductos}
              renderItem={renderProducto}
              keyExtractor={(item) => item.id}
              style={styles.productosList}
              showsVerticalScrollIndicator={false}
            />
          </View>

          <View style={styles.carritoSection}>
            <Text style={styles.sectionTitle}>
              Carrito ({carritoItems.length} productos)
            </Text>
            {carritoItems.length > 0 ? (
              <>
                <FlatList
                  data={carritoItems}
                  renderItem={renderCarritoItem}
                  keyExtractor={(item) => item.id}
                  style={styles.carritoList}
                  showsVerticalScrollIndicator={false}
                />
                <View style={styles.totalContainer}>
                  <Text style={styles.totalText}>
                    Total: ${calcularTotal().toFixed(2)}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.carritoEmpty}>El carrito está vacío</Text>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.ventaButton,
              (carritoItems.length === 0 || loading) &&
                styles.ventaButtonDisabled,
            ]}
            onPress={procesarVenta}
            disabled={carritoItems.length === 0 || loading}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.ventaButtonText}>
              {loading ? 'Procesando...' : 'Procesar Venta'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  searchSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    gap: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  productosSection: {
    flex: 1,
    padding: 16,
  },
  carritoSection: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  productosList: {
    flex: 1,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#eff6ff',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productCategory: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  cantidadBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  carritoList: {
    flex: 1,
  },
  carritoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  carritoInfo: {
    flex: 1,
  },
  carritoName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  carritoPrice: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  carritoSubtotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginTop: 2,
  },
  carritoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carritoEmpty: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 40,
  },
  totalContainer: {
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    marginTop: 16,
  },
  totalText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  ventaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  ventaButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  ventaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
