import { Package, Save, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
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
import { supabase } from '../lib/supabase';

export default function ProductForm({ visible, onClose, product, onSave }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    stock: '',
    descripcion: '',
    categoria_id: '',
  });
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setCategorias(data || []);
    } catch {
      Alert.alert(t('common.error'), t('productForm.loadCategoriesError'));
    }
  }, [t]);

  useEffect(() => {
    if (visible) {
      loadCategorias();
      if (product) {
        setFormData({
          nombre: product.nombre || '',
          precio: product.precio?.toString() || '',
          stock: product.stock?.toString() || '',
          descripcion: product.descripcion || '',
          categoria_id: product.categoria_id || '',
        });
      } else {
        setFormData({
          nombre: '',
          precio: '',
          stock: '',
          descripcion: '',
          categoria_id: '',
        });
      }
    }
  }, [visible, product, loadCategorias]);

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      Alert.alert(t('common.error'), t('productForm.nameRequired'));
      return;
    }

    if (!formData.precio || Number.isNaN(parseFloat(formData.precio))) {
      Alert.alert(t('common.error'), t('productForm.priceRequired'));
      return;
    }

    if (!formData.stock || Number.isNaN(parseInt(formData.stock))) {
      Alert.alert(t('common.error'), t('productForm.stockRequired'));
      return;
    }

    if (!formData.categoria_id) {
      Alert.alert(t('common.error'), t('productForm.categoryRequired'));
      return;
    }

    setLoading(true);

    try {
      const productData = {
        nombre: formData.nombre.trim(),
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        descripcion: formData.descripcion.trim(),
        categoria_id: formData.categoria_id,
      };

      let result;
      if (product) {
        result = await supabase
          .from('productos')
          .update(productData)
          .eq('id', product.id)
          .select();
      } else {
        result = await supabase
          .from('productos')
          .insert([productData])
          .select();
      }

      if (result.error) throw result.error;

      Alert.alert(
        t('common.success'),
        product
          ? t('productForm.updateSuccess')
          : t('productForm.createSuccess')
      );
      onSave();
      onClose();
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('productForm.createError') + ': ' + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Package size={24} color="#2563EB" />
            <Text style={styles.title}>
              {product
                ? t('productForm.editProduct')
                : t('productForm.newProduct')}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('productForm.productName')}</Text>
            <TextInput
              style={styles.input}
              value={formData.nombre}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, nombre: text }))
              }
              placeholder={t('productForm.productNamePlaceholder')}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('productForm.productPrice')}</Text>
            <TextInput
              style={styles.input}
              value={formData.precio}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, precio: text }))
              }
              placeholder={t('productForm.pricePlaceholder')}
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('productForm.productStock')}</Text>
            <TextInput
              style={styles.input}
              value={formData.stock}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, stock: text }))
              }
              placeholder={t('productForm.stockPlaceholder')}
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('productForm.selectCategory')}</Text>
            <View style={styles.categoryContainer}>
              {categorias.map((categoria) => (
                <TouchableOpacity
                  key={categoria.id}
                  style={[
                    styles.categoryButton,
                    formData.categoria_id === categoria.id &&
                      styles.categoryButtonSelected,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      categoria_id: categoria.id,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      formData.categoria_id === categoria.id &&
                        styles.categoryButtonTextSelected,
                    ]}
                  >
                    {categoria.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('productForm.productDescription')}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descripcion}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, descripcion: text }))
              }
              placeholder={t('productForm.descriptionPlaceholder')}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              {loading
                ? t('productForm.creating')
                : t('productForm.saveProduct')}
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
    padding: 20,
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
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  categoryButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#ffffff',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
