import { Save, Tag, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

export default function CategoryForm({ visible, onClose, category, onSave }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (category) {
        setFormData({
          nombre: category.nombre || '',
          descripcion: category.descripcion || '',
        });
      } else {
        setFormData({
          nombre: '',
          descripcion: '',
        });
      }
    }
  }, [visible, category]);

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      Alert.alert(t('common.error'), t('categories.nameRequired'));
      return;
    }

    setLoading(true);

    try {
      const categoryData = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
      };

      let result;
      if (category) {
        result = await supabase
          .from('categorias')
          .update(categoryData)
          .eq('id', category.id)
          .select();
      } else {
        result = await supabase
          .from('categorias')
          .insert([categoryData])
          .select();
      }

      if (result.error) throw result.error;

      Alert.alert(
        t('common.success'),
        category ? t('categories.updateSuccess') : t('categories.createSuccess')
      );
      onSave();
      onClose();
    } catch (error) {
      if (error.code === '23505') {
        Alert.alert(t('common.error'), t('categories.duplicateNameError'));
      } else {
        Alert.alert(
          t('common.error'),
          t('categories.createError') + ': ' + error.message
        );
      }
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
            <Tag size={24} color="#7C3AED" />
            <Text style={[styles.title, { color: colors.text }]}>
              {category
                ? t('categories.editCategory')
                : t('categories.newCategory')}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t('categories.categoryName')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.nombre}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, nombre: text }))
              }
              placeholder={t('categories.categoryNamePlaceholder')}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t('categories.categoryDescription')}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={formData.descripcion}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, descripcion: text }))
              }
              placeholder={t('categories.descriptionPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              {loading
                ? t('categories.creating')
                : t('categories.saveCategory')}
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
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
