import { BlurView } from 'expo-blur';
import { Plus, Save, Trash2, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useSupabaseTenant } from '../hooks/useSupabaseTenant';
import { CustomAlert } from './CustomAlert';

export default function EditVentaForm({ visible, onClose, venta, onSave }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { updateVenta, getProductos } = useSupabaseTenant();
  const [formData, setFormData] = useState({
    fecha: '',
    productos: [],
  });
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const styles = createStyles(colors);

  // Cargar productos disponibles
  const loadProductosDisponibles = useCallback(async () => {
    try {
      const { data, error } = await getProductos();
      if (error) throw error;
      setProductosDisponibles(data || []);
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
      loadProductosDisponibles();
    }
  }, [visible, loadProductosDisponibles]);

  useEffect(() => {
    if (venta) {
      setFormData({
        fecha: venta.fecha,
        productos:
          venta.detalle_ventas?.map((detalle) => ({
            id: detalle.id,
            producto_id: detalle.producto_id,
            nombre: detalle.productos?.nombre || 'Producto sin nombre',
            cantidad: detalle.cantidad.toString(),
            precio_unitario: detalle.precio_unitario.toString(),
          })) || [],
      });
    }
  }, [venta]);

  const handleSave = async () => {
    if (!formData.fecha.trim()) {
      CustomAlert.alert(
        t('common.error'),
        t('editSale.dateRequired'),
        [],
        'error'
      );
      return;
    }

    const productosValidos = formData.productos.filter(
      (p) => p.cantidad && p.precio_unitario
    );

    if (productosValidos.length === 0) {
      CustomAlert.alert(
        t('common.error'),
        t('editSale.atLeastOneProduct'),
        [],
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      // Calcular nuevo total
      const nuevoTotal = productosValidos.reduce(
        (sum, p) =>
          sum + parseFloat(p.cantidad) * parseFloat(p.precio_unitario),
        0
      );

      // Preparar datos de la venta actualizada
      const ventaData = {
        fecha: formData.fecha,
        total: nuevoTotal,
      };

      // Preparar productos con el formato esperado por updateVenta
      const productosVenta = productosValidos.map((p) => ({
        id: p.producto_id,
        cantidad: parseFloat(p.cantidad),
        precio: parseFloat(p.precio_unitario),
      }));

      // Usar la función updateVenta del hook
      const { error } = await updateVenta(venta.id, ventaData, productosVenta);

      if (error) throw error;

      CustomAlert.alert(
        t('common.success'),
        t('editSale.updateSuccess'),
        [],
        'success'
      );
      onSave();
      onClose();
    } catch (error) {
      CustomAlert.alert(
        t('common.error'),
        `${t('editSale.updateError')}: ${error.message}`,
        [],
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProducto = (index, field, value) => {
    const newProductos = [...formData.productos];
    newProductos[index][field] = value;
    setFormData({
      ...formData,
      productos: newProductos,
    });
  };

  const agregarProducto = (producto) => {
    const existingProduct = formData.productos.find(
      (p) => p.producto_id === producto.id
    );

    if (existingProduct) {
      CustomAlert.alert(
        t('common.warning'),
        'Este producto ya está en la venta. Puedes modificar su cantidad.',
        [],
        'warning'
      );
      return;
    }

    const newProducto = {
      id: Date.now(), // ID temporal para el detalle
      producto_id: producto.id,
      nombre: producto.nombre,
      cantidad: '1',
      precio_unitario: producto.precio.toString(),
    };

    setFormData({
      ...formData,
      productos: [...formData.productos, newProducto],
    });
    setShowProductSelector(false);
  };

  const eliminarProducto = (index) => {
    CustomAlert.alert(
      t('common.confirm'),
      `¿Eliminar ${formData.productos[index].nombre} de la venta?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            const newProductos = formData.productos.filter(
              (_, i) => i !== index
            );
            setFormData({
              ...formData,
              productos: newProductos,
            });
          },
        },
      ],
      'warning'
    );
  };

  const renderProductSelector = () => {
    const productosNoEnVenta = productosDisponibles.filter(
      (producto) =>
        !formData.productos.some((p) => p.producto_id === producto.id)
    );

    console.log('DEBUG - productosDisponibles:', productosDisponibles.length);
    console.log('DEBUG - productosNoEnVenta:', productosNoEnVenta.length);

    return (
      <Modal
        visible={showProductSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductSelector(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowProductSelector(false)}
          >
            <BlurView
              intensity={80}
              tint={colors.background === '#ffffff' ? 'light' : 'dark'}
              style={styles.blurView}
            />
          </Pressable>
          <View style={styles.selectorContainer}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>Agregar Producto</Text>
              <TouchableOpacity
                onPress={() => setShowProductSelector(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={productosNoEnVenta}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productItem}
                  onPress={() => agregarProducto(item)}
                >
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.nombre}</Text>
                    <Text style={styles.productPrice}>
                      ${item.precio} - Stock: {item.stock}
                    </Text>
                  </View>
                  <Plus size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
              style={styles.productList}
            />
          </View>
        </View>
      </Modal>
    );
  };

  // No mostrar el modal hasta que tengamos datos de la venta
  if (!venta || !visible) {
    return null;
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose}>
            <BlurView
              intensity={80}
              tint={colors.background === '#ffffff' ? 'light' : 'dark'}
              style={styles.blurView}
            />
          </Pressable>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <Save size={24} color={colors.primary} />
                <Text style={styles.title}>{t('editSale.title')}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.form}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('common.date')}</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fecha}
                  onChangeText={(value) =>
                    setFormData({ ...formData, fecha: value })
                  }
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.label}>{t('products.title')}</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowProductSelector(true)}
                  >
                    <Plus size={20} color={colors.primary} />
                    <Text style={styles.addButtonText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
                {formData.productos.map((producto, index) => (
                  <View key={producto.id} style={styles.productoCard}>
                    <View style={styles.productoHeader}>
                      <Text style={styles.productoNombre}>
                        {producto.nombre}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => eliminarProducto(index)}
                      >
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.productoRow}>
                      <TextInput
                        style={styles.productoInput}
                        value={producto.cantidad}
                        onChangeText={(value) =>
                          updateProducto(index, 'cantidad', value)
                        }
                        placeholder={t('common.quantity')}
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={styles.productoInput}
                        value={producto.precio_unitario}
                        onChangeText={(value) =>
                          updateProducto(index, 'precio_unitario', value)
                        }
                        placeholder={t('common.price')}
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  loading && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                <Save size={20} color="#ffffff" />
                <Text style={styles.buttonText}>
                  {loading ? t('common.saving') : t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {renderProductSelector()}
    </>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    blurView: {
      flex: 1,
    },
    container: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '75%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    form: {
      flexGrow: 1,
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    productoCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    productoNombre: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    productoRow: {
      flexDirection: 'row',
      gap: 8,
    },
    productoInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      padding: 8,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.background,
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },
    cancelButton: {
      backgroundColor: colors.border,
      marginRight: 8,
    },
    saveButton: {
      backgroundColor: colors.primary,
      marginLeft: 8,
    },
    saveButtonDisabled: {
      backgroundColor: colors.textSecondary,
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.primary,
      gap: 4,
    },
    addButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    productoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    deleteButton: {
      padding: 4,
      borderRadius: 4,
    },
    selectorContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    selectorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    productList: {
      flex: 1,
      padding: 16,
    },
    productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    productPrice: {
      fontSize: 14,
      color: colors.textSecondary,
    },
  });
