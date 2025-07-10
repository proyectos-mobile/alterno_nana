import { useFocusEffect } from '@react-navigation/native';
import {
  ChartBar as BarChart3,
  CreditCard as Edit3,
  Globe,
  LogOut,
  Moon,
  Package,
  Plus,
  Settings,
  Smartphone,
  Store,
  Sun,
  Tag,
  Trash2,
  User,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CategoryForm from '../../components/CategoryForm';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSupabaseTenant } from '../../hooks/useSupabaseTenant';

export default function ConfiguracionScreen() {
  const { theme, colors, changeTheme } = useTheme();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const { user, tenant, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stats, setStats] = useState({
    totalCategorias: 0,
    totalProductos: 0,
    totalVentas: 0,
  });
  const { getCategorias, getProductos, getVentas, deleteCategoria } =
    useSupabaseTenant();

  const loadCategorias = useCallback(async () => {
    try {
      const { data, error } = await getCategorias();

      if (error) throw error;

      const categoriasWithCount = (data || []).map((categoria) => ({
        ...categoria,
        productosCount: categoria.productos?.length || 0,
      }));

      setCategorias(categoriasWithCount);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        `${t('settings.loadCategoriesError')}: ${error.message}`
      );
    }
  }, [getCategorias, t]);

  const loadStats = useCallback(async () => {
    try {
      const [categoriasResult, productosResult, ventasResult] =
        await Promise.all([getCategorias(), getProductos(), getVentas()]);

      setStats({
        totalCategorias: categoriasResult.data?.length || 0,
        totalProductos: productosResult.data?.length || 0,
        totalVentas: ventasResult.data?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [getCategorias, getProductos, getVentas]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadCategorias(), loadStats()]);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        `${t('settings.loadError')}: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  }, [loadCategorias, loadStats, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
        t('settings.cannotDelete'),
        t('settings.categoryHasProducts')
      );
      return;
    }

    Alert.alert(
      t('settings.confirmDelete'),
      t('settings.confirmDeleteMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await deleteCategoria(categoryId);

              if (error) throw error;

              Alert.alert(t('common.success'), t('settings.deleteSuccess'));
              loadData();
            } catch (error) {
              Alert.alert(
                t('common.error'),
                `${t('settings.deleteError')}: ${error.message}`
              );
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

  const renderThemeSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('settings.theme')}
        </Text>
      </View>

      <View style={styles.themeOptions}>
        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: colors.background, borderColor: colors.border },
            theme === 'light' && {
              borderColor: colors.primary,
              borderWidth: 2,
            },
          ]}
          onPress={() => changeTheme('light')}
        >
          <Sun size={24} color={colors.text} />
          <Text style={[styles.themeOptionText, { color: colors.text }]}>
            {t('settings.light')}
          </Text>
          {theme === 'light' && (
            <View
              style={[styles.themeCheck, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.themeCheckText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: colors.background, borderColor: colors.border },
            theme === 'dark' && { borderColor: colors.primary, borderWidth: 2 },
          ]}
          onPress={() => changeTheme('dark')}
        >
          <Moon size={24} color={colors.text} />
          <Text style={[styles.themeOptionText, { color: colors.text }]}>
            {t('settings.dark')}
          </Text>
          {theme === 'dark' && (
            <View
              style={[styles.themeCheck, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.themeCheckText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.themeOption,
            { backgroundColor: colors.background, borderColor: colors.border },
            theme === 'system' && {
              borderColor: colors.primary,
              borderWidth: 2,
            },
          ]}
          onPress={() => changeTheme('system')}
        >
          <Smartphone size={24} color={colors.text} />
          <Text style={[styles.themeOptionText, { color: colors.text }]}>
            {t('settings.system')}
          </Text>
          {theme === 'system' && (
            <View
              style={[styles.themeCheck, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.themeCheckText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
        {theme === 'system'
          ? t('settings.themeSystemDescription')
          : theme === 'light'
          ? t('settings.themeLightSelected')
          : t('settings.themeDarkSelected')}
      </Text>
    </View>
  );

  const renderLanguageSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('settings.language')}
        </Text>
      </View>

      <View style={styles.themeOptions}>
        {availableLanguages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.themeOption,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
              currentLanguage === language.code && {
                borderColor: colors.primary,
                borderWidth: 2,
              },
            ]}
            onPress={() => changeLanguage(language.code)}
          >
            <Globe size={24} color={colors.text} />
            <Text style={[styles.themeOptionText, { color: colors.text }]}>
              {t(
                language.code === 'es' ? 'settings.spanish' : 'settings.english'
              )}
            </Text>
            {currentLanguage === language.code && (
              <View
                style={[styles.themeCheck, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.themeCheckText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
        {currentLanguage === 'es'
          ? t('settings.currentLanguageSpanish')
          : t('settings.currentLanguageEnglish')}
      </Text>
    </View>
  );

  const handleLogout = () => {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirmation'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const renderTenantInfo = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Store size={24} color="#10B981" />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('settings.storeInfo')}
        </Text>
      </View>

      <View style={styles.tenantInfoContainer}>
        <View style={styles.tenantInfo}>
          <Text style={[styles.tenantName, { color: colors.text }]}>
            {tenant?.nombre || 'Papelería'}
          </Text>
          <Text style={[styles.tenantDetails, { color: colors.textSecondary }]}>
            ID: {tenant?.slug || 'N/A'}
          </Text>
          {tenant?.direccion && (
            <Text
              style={[styles.tenantDetails, { color: colors.textSecondary }]}
            >
              {tenant.direccion}
            </Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <User size={16} color={colors.textSecondary} />
          <Text style={[styles.userName, { color: colors.textSecondary }]}>
            {user?.nombre || 'Usuario'}
          </Text>
          <Text style={[styles.userRole, { color: colors.primary }]}>
            {isAdmin() ? t('settings.admin') : t('settings.employee')}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.logoutButton,
          { backgroundColor: colors.error || '#EF4444' },
        ]}
        onPress={handleLogout}
      >
        <LogOut size={20} color="#FFFFFF" />
        <Text style={styles.logoutButtonText}>{t('settings.logout')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatsCard = () => (
    <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.statsTitle, { color: colors.text }]}>
        {t('settings.statistics')}
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Tag size={24} color="#7C3AED" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalCategorias}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('settings.totalCategories')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Package size={24} color="#2563EB" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalProductos}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('products.totalProducts')}
          </Text>
        </View>
        <View style={styles.statItem}>
          <BarChart3 size={24} color="#059669" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalVentas}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {t('sales.totalSales')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCategoryItem = ({ item }) => (
    <View
      style={[
        styles.categoryCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, { color: colors.text }]}>
          {item.nombre}
        </Text>
        <Text
          style={[styles.categoryDescription, { color: colors.textSecondary }]}
        >
          {item.descripcion}
        </Text>
        <Text style={[styles.categoryCount, { color: colors.textTertiary }]}>
          {item.productosCount}{' '}
          {item.productosCount !== 1
            ? t('settings.productCountPlural')
            : t('settings.productCount')}
        </Text>
      </View>
      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={() => handleEditCategory(item)}
        >
          <Edit3 size={16} color="#059669" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={() => handleDeleteCategory(item.id, item.productosCount)}
        >
          <Trash2 size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoriesSection = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('settings.categories')}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowCategoryForm(true)}
        >
          <Plus size={16} color="#ffffff" />
          <Text style={styles.addButtonText}>{t('settings.newCategory')}</Text>
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
          <Tag size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('settings.noCategories')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('settings.createFirstCategory')}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            {t('settings.loadingSettings')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <View style={styles.titleContainer}>
              <Settings size={28} color="#6B46C1" />
              <Text style={[styles.title, { color: colors.text }]}>
                {t('settings.title')}
              </Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('settings.subtitle')}
            </Text>
          </View>

          {renderTenantInfo()}
          {renderStatsCard()}
          {renderThemeSection()}
          {renderLanguageSection()}
          {renderCategoriesSection()}
        </ScrollView>
      )}

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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  header: {
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
  },
  subtitle: {
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  themeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCheckText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  themeDescription: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsCard: {
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  tenantInfoContainer: {
    gap: 16,
  },
  tenantInfo: {
    gap: 4,
  },
  tenantName: {
    fontSize: 20,
    fontWeight: '700',
  },
  tenantDetails: {
    fontSize: 14,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
