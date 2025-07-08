import {
  TriangleAlert as AlertTriangle,
  CreditCard as Edit3,
  Trash2,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function ProductCard({ product, onEdit, onDelete }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isLowStock = product.stock <= 10;

  const handleDelete = () => {
    Alert.alert(
      t('products.deleteConfirm'),
      t('products.deleteMessage', { name: product.nombre }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => onDelete(product.id),
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isLowStock && {
          borderColor: colors.warning + '60',
          backgroundColor: colors.warning + '10',
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, { color: colors.text }]}>
            {product.nombre}
          </Text>
          {isLowStock && (
            <View style={styles.warningContainer}>
              <AlertTriangle size={16} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                {t('products.lowStockText')}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.background },
            ]}
            onPress={() => onEdit(product)}
          >
            <Edit3 size={16} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.background },
            ]}
            onPress={handleDelete}
          >
            <Trash2 size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {product.descripcion}
      </Text>
      <Text style={[styles.category, { color: colors.textTertiary }]}>
        {t('products.categoryLabel')} {product.categoria_nombre}
      </Text>

      <View style={styles.footer}>
        <Text style={[styles.price, { color: colors.success }]}>
          ${product.precio}
        </Text>
        <Text
          style={[
            styles.stock,
            { color: colors.text },
            isLowStock && { color: colors.danger },
          ]}
        >
          {t('common.stockLabel')} {product.stock}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    marginBottom: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
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
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
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
  },
  stock: {
    fontSize: 14,
    fontWeight: '500',
  },
});
