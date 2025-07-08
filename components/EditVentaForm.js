import { Save, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

export default function EditVentaForm({ visible, onClose, venta, onSave }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [fecha, setFecha] = useState('');
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (venta) {
      setFecha(venta.fecha);
      setProductos(
        venta.detalle_ventas.map((detalle) => ({
          id: detalle.id,
          producto_id: detalle.producto_id,
          nombre: detalle.productos?.nombre || '',
          cantidad: detalle.cantidad.toString(),
          precio_unitario: detalle.precio_unitario.toString(),
        }))
      );
    }
  }, [venta]);

  const handleSave = async () => {
    if (!fecha.trim()) {
      Alert.alert(t('common.error'), t('editSale.dateRequired'));
      return;
    }

    const productosValidos = productos.filter(
      (p) => p.cantidad && p.precio_unitario
    );

    if (productosValidos.length === 0) {
      Alert.alert(t('common.error'), t('editSale.atLeastOneProduct'));
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

      // PASO 1: Restaurar el stock de la venta original
      for (const detalleOriginal of venta.detalle_ventas) {
        // Obtener el stock actual
        const { data: productoActual, error: getError } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', detalleOriginal.producto_id)
          .single();

        if (getError) throw getError;

        // Restaurar el stock
        const { error: stockError } = await supabase
          .from('productos')
          .update({
            stock: productoActual.stock + detalleOriginal.cantidad,
          })
          .eq('id', detalleOriginal.producto_id);

        if (stockError) throw stockError;
      }

      // PASO 2: Verificar que hay stock suficiente para la nueva venta
      for (const producto of productosValidos) {
        const { data: productoActual, error: checkError } = await supabase
          .from('productos')
          .select('stock, nombre')
          .eq('id', producto.producto_id)
          .single();

        if (checkError) throw checkError;

        if (productoActual.stock < parseFloat(producto.cantidad)) {
          // Si no hay stock suficiente, revertir los cambios hechos hasta ahora
          for (const detalleRevert of venta.detalle_ventas) {
            const { data: productoRevert, error: getRevertError } =
              await supabase
                .from('productos')
                .select('stock')
                .eq('id', detalleRevert.producto_id)
                .single();

            if (!getRevertError) {
              await supabase
                .from('productos')
                .update({
                  stock: productoRevert.stock - detalleRevert.cantidad,
                })
                .eq('id', detalleRevert.producto_id);
            }
          }

          Alert.alert(
            t('editSale.insufficientStock'),
            t('editSale.insufficientStock', {
              name: productoActual.nombre,
              available: productoActual.stock,
              requested: producto.cantidad,
            })
          );
          return;
        }
      }

      // PASO 3: Actualizar venta
      const { error: ventaError } = await supabase
        .from('ventas')
        .update({
          fecha,
          total: nuevoTotal,
        })
        .eq('id', venta.id);

      if (ventaError) throw ventaError;

      // PASO 4: Eliminar detalles existentes
      const { error: deleteError } = await supabase
        .from('detalle_ventas')
        .delete()
        .eq('venta_id', venta.id);

      if (deleteError) throw deleteError;

      // PASO 5: Insertar nuevos detalles
      const detallesData = productosValidos.map((p) => ({
        venta_id: venta.id,
        producto_id: p.producto_id,
        cantidad: parseFloat(p.cantidad),
        precio_unitario: parseFloat(p.precio_unitario),
      }));

      const { error: insertError } = await supabase
        .from('detalle_ventas')
        .insert(detallesData);

      if (insertError) throw insertError;

      // PASO 6: Deducir el stock de los productos en la nueva venta
      for (const producto of productosValidos) {
        // Obtener el stock actual
        const { data: productoActual, error: getError } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', producto.producto_id)
          .single();

        if (getError) throw getError;

        // Deducir el stock
        const { error: stockError } = await supabase
          .from('productos')
          .update({
            stock: productoActual.stock - parseFloat(producto.cantidad),
          })
          .eq('id', producto.producto_id);

        if (stockError) throw stockError;
      }

      Alert.alert(t('common.success'), t('editSale.updateSuccess'));
      onSave();
      onClose();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('editSale.updateError') + ': ' + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProducto = (index, field, value) => {
    const newProductos = [...productos];
    newProductos[index][field] = value;
    setProductos(newProductos);
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    section: {
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
      color: colors.text,
      backgroundColor: colors.background,
    },
    productoCard: {
      backgroundColor: colors.background,
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
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 20,
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
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    cancelButtonText: {
      color: colors.text,
    },
    saveButtonText: {
      color: '#ffffff',
    },
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('editSale.title')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.label}>{t('common.date')}</Text>
              <TextInput
                style={styles.input}
                value={fecha}
                onChangeText={setFecha}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>{t('products.title')}</Text>
              {productos.map((producto, index) => (
                <View key={producto.id} style={styles.productoCard}>
                  <Text style={styles.productoNombre}>{producto.nombre}</Text>
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
                      keyboardType="decimal-pad"
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
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Save size={16} color="#ffffff" />
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                {loading ? t('editSale.saving') : t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
