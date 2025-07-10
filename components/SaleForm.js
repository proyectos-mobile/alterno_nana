import {
  Minus,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabaseTenant } from '../hooks/useSupabaseTenant';
import { CustomAlert } from './CustomAlert';

export default function SaleForm({ visible, onClose, onSave }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { getProductos, insertVenta } = useSupabaseTenant();
  const [productos, setProductos] = useState([]);
  const [carritoItems, setCarritoItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProductos = useCallback(async () => {
    try {
      const { data, error } = await getProductos();

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      CustomAlert.alert(
        t('common.error'),
        `${t('products.loadError')}: ${error.message}`,
        [],
        'error'
      );
    }
  }, [getProductos, t]);

  useEffect(() => {
    if (visible) {
      loadProductos();
      setCarritoItems([]);
      setSearchQuery('');
    }
  }, [visible, loadProductos]);

  const agregarAlCarrito = useCallback(
    (producto) => {
      setCarritoItems((prev) => {
        const existingItem = prev.find((item) => item.id === producto.id);
        if (existingItem) {
          if (existingItem.cantidad >= producto.stock) {
            CustomAlert.alert(
              t('saleForm.insufficientStock'),
              t('saleForm.onlyAvailable', { stock: producto.stock }),
              [],
              'warning'
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
    },
    [t]
  );

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
        CustomAlert.alert(
          'Stock insuficiente',
          `Solo hay ${producto.stock} unidades disponibles`,
          [],
          'warning'
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
      CustomAlert.alert(
        t('common.error'),
        t('saleForm.addAtLeastOne'),
        [],
        'error'
      );
      return;
    }

    setLoading(true);

    try {
      // Preparar datos de la venta
      const ventaData = {
        fecha: new Date().toISOString().split('T')[0],
        total: calcularTotal(),
      };

      // Preparar productos del carrito
      const productosVenta = carritoItems.map((item) => ({
        id: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
      }));

      // Usar la función insertVenta del hook
      const { error } = await insertVenta(ventaData, productosVenta);

      if (error) throw error;

      CustomAlert.alert(
        t('common.success'),
        t('sales.processSuccess'),
        [],
        'success'
      );
      onSave();
      onClose();
    } catch (error) {
      CustomAlert.alert(
        t('common.error'),
        `${t('sales.processError')}: ${error.message}`,
        [],
        'error'
      );
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
          style={[
            styles.productCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
            enCarrito && {
              borderColor: colors.primary,
              backgroundColor: colors.primaryLight,
            },
          ]}
          onPress={() => agregarAlCarrito(item)}
        >
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: colors.text }]}>
              {item.nombre}
            </Text>
            <Text
              style={[styles.productCategory, { color: colors.textSecondary }]}
            >
              {item.categorias?.nombre}
            </Text>
            <Text style={[styles.productPrice, { color: colors.success }]}>
              ${item.precio}
            </Text>
            <Text style={[styles.productStock, { color: colors.textTertiary }]}>
              Stock: {item.stock}
            </Text>
          </View>
          {enCarrito && (
            <View
              style={[
                styles.cantidadBadge,
                { backgroundColor: colors.primary },
              ]}
            >
              <Text style={styles.cantidadBadgeText}>{enCarrito.cantidad}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [carritoItems, agregarAlCarrito, colors]
  );

  const renderCarritoItem = useCallback(
    ({ item }) => (
      <View style={[styles.carritoItem, { borderBottomColor: colors.border }]}>
        <View style={styles.carritoInfo}>
          <Text style={[styles.carritoName, { color: colors.text }]}>
            {item.nombre}
          </Text>
          <Text style={[styles.carritoPrice, { color: colors.textSecondary }]}>
            ${item.precio} x {item.cantidad}
          </Text>
          <Text style={[styles.carritoSubtotal, { color: colors.success }]}>
            ${(item.precio * item.cantidad).toFixed(2)}
          </Text>
        </View>
        <View style={styles.carritoControls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: colors.background },
            ]}
            onPress={() => actualizarCantidad(item.id, item.cantidad - 1)}
          >
            <Minus size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.cantidadText, { color: colors.text }]}>
            {item.cantidad}
          </Text>
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: colors.background },
            ]}
            onPress={() => actualizarCantidad(item.id, item.cantidad + 1)}
          >
            <Plus size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { backgroundColor: colors.errorLight },
            ]}
            onPress={() => eliminarDelCarrito(item.id)}
          >
            <Trash2 size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [actualizarCantidad, eliminarDelCarrito, colors]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.titleContainer}>
            <ShoppingCart size={24} color={colors.secondary} />
            <Text style={[styles.title, { color: colors.text }]}>
              {t('saleForm.newSale')}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchSection,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <View style={styles.searchContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('saleForm.availableProducts')}
            </Text>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t('products.searchProducts')}
              placeholderTextColor={colors.textTertiary}
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

          <View
            style={[
              styles.carritoSection,
              {
                backgroundColor: colors.surface,
                borderLeftColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('saleForm.cart')} ({carritoItems.length}{' '}
              {t('saleForm.cartProducts')})
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
                <View
                  style={[
                    styles.totalContainer,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.totalText, { color: colors.text }]}>
                    {t('common.total')}: ${calcularTotal().toFixed(2)}
                  </Text>
                </View>
              </>
            ) : (
              <Text
                style={[styles.carritoEmpty, { color: colors.textTertiary }]}
              >
                {t('saleForm.emptyCart')}
              </Text>
            )}
          </View>
        </View>

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.ventaButton,
              { backgroundColor: colors.success },
              (carritoItems.length === 0 || loading) && {
                backgroundColor: colors.textTertiary,
              },
            ]}
            onPress={procesarVenta}
            disabled={carritoItems.length === 0 || loading}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.ventaButtonText}>
              {loading ? t('sales.processing') : t('saleForm.processSale')}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchContainer: {
    gap: 12,
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
    borderLeftWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  productosList: {
    flex: 1,
  },
  productCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    marginTop: 2,
  },
  cantidadBadge: {
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
  },
  carritoInfo: {
    flex: 1,
  },
  carritoName: {
    fontSize: 14,
    fontWeight: '500',
  },
  carritoPrice: {
    fontSize: 12,
    marginTop: 2,
  },
  carritoSubtotal: {
    fontSize: 14,
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  cantidadText: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carritoEmpty: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  totalContainer: {
    paddingTop: 16,
    borderTopWidth: 2,
    marginTop: 16,
  },
  totalText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  ventaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  ventaButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
