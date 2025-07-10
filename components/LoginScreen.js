import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    tenantNombre: '',
    tenantTelefono: '',
    tenantDireccion: '',
    adminNombre: '',
  });

  const { login, register, loading } = useAuth();
  const { colors, isDark, changeTheme } = useTheme();
  const styles = createStyles(colors);

  const handleLogin = async () => {
    if (!email.trim() || !tenantSlug.trim()) {
      Alert.alert(t('auth.errorTitle'), t('auth.completeAllFields'));
      return;
    }

    const result = await login(email.toLowerCase(), tenantSlug.toLowerCase());

    if (!result.success) {
      Alert.alert(t('auth.errorTitle'), result.error);
    }
  };

  const handleRegister = async () => {
    if (
      !email.trim() ||
      !tenantSlug.trim() ||
      !registerData.tenantNombre.trim() ||
      !registerData.adminNombre.trim()
    ) {
      Alert.alert(t('auth.errorTitle'), t('auth.completeRequiredFields'));
      return;
    }

    const tenantData = {
      slug: tenantSlug.toLowerCase().replace(/[^a-z0-9]/g, ''),
      nombre: registerData.tenantNombre,
      telefono: registerData.tenantTelefono,
      direccion: registerData.tenantDireccion,
    };

    const adminData = {
      email: email.toLowerCase(),
      nombre: registerData.adminNombre,
    };

    const result = await register(tenantData, adminData);

    if (!result.success) {
      Alert.alert(t('auth.errorTitle'), result.error);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    // Limpiar campos al cambiar de modo
    setEmail('');
    setTenantSlug('');
    setRegisterData({
      tenantNombre: '',
      tenantTelefono: '',
      tenantDireccion: '',
      adminNombre: '',
    });
  };

  const fillDemoData = async () => {
    // Feedback háptico
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setEmail('admin@papelerianana.com');
    setTenantSlug('nana');

    // Pequeña confirmación visual
    Alert.alert(t('auth.demoDataFilled'), t('auth.demoDataFilledMessage'), [
      { text: t('auth.demoUnderstood'), style: 'default' },
    ]);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
            </Text>
            <Text style={styles.subtitle}>
              {isRegister
                ? t('auth.registerSubtitle')
                : t('auth.loginSubtitle')}
            </Text>
          </View>

          {/* Theme Switch - Solo en login */}
          {!isRegister && (
            <View style={styles.themeSwitch}>
              <Text style={styles.themeSwitchLabel}>
                {isDark ? '🌙' : '☀️'}
              </Text>
              <Switch
                value={isDark}
                onValueChange={(value) => changeTheme(value ? 'dark' : 'light')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDark ? colors.surface : colors.background}
                style={styles.switch}
              />
            </View>
          )}

          <View style={styles.form}>
            {isRegister && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t('auth.tenantName')} {t('auth.required')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={registerData.tenantNombre}
                    onChangeText={(text) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        tenantNombre: text,
                      }))
                    }
                    placeholder={t('auth.tenantNamePlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {t('auth.adminName')} {t('auth.required')}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={registerData.adminNombre}
                    onChangeText={(text) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        adminNombre: text,
                      }))
                    }
                    placeholder={t('auth.adminNamePlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t('auth.email')} {t('auth.required')}
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.emailPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {isRegister
                  ? t('auth.tenantSlugRegister')
                  : t('auth.tenantSlugLogin')}{' '}
                {t('auth.required')}
              </Text>
              <TextInput
                style={styles.input}
                value={tenantSlug}
                onChangeText={setTenantSlug}
                placeholder={
                  isRegister
                    ? t('auth.tenantSlugPlaceholderRegister')
                    : t('auth.tenantSlugPlaceholderLogin')
                }
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
              {isRegister && (
                <Text style={styles.helperText}>
                  {t('auth.tenantSlugHelper')}
                </Text>
              )}
            </View>

            {isRegister && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.phone')}</Text>
                  <TextInput
                    style={styles.input}
                    value={registerData.tenantTelefono}
                    onChangeText={(text) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        tenantTelefono: text,
                      }))
                    }
                    placeholder={t('auth.phonePlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.address')}</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={registerData.tenantDireccion}
                    onChangeText={(text) =>
                      setRegisterData((prev) => ({
                        ...prev,
                        tenantDireccion: text,
                      }))
                    }
                    placeholder={t('auth.addressPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? isRegister
                    ? t('auth.registering')
                    : t('auth.loggingIn')
                  : isRegister
                  ? t('auth.registerButton')
                  : t('auth.loginButton')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleMode}
              disabled={loading}
            >
              <Text style={styles.toggleText}>
                {isRegister
                  ? t('auth.toggleToLogin')
                  : t('auth.toggleToRegister')}
              </Text>
            </TouchableOpacity>
          </View>

          {!isRegister && (
            <Pressable
              style={({ pressed }) => [
                styles.demoSection,
                pressed && styles.demoSectionPressed,
              ]}
              onPress={fillDemoData}
            >
              <Text style={styles.demoTitle}>{t('auth.demoTitle')}</Text>
              <Text style={styles.demoText}>{t('auth.demoText')}</Text>
              <View style={styles.demoCredentialsContainer}>
                <Text style={styles.demoCredentials}>
                  📧 admin@papelerianana.com{'\n'}🏪 nana
                </Text>
                <Text style={styles.demoHint}>{t('auth.demoHint')}</Text>
              </View>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
      paddingBottom: 40, // Padding específico en la parte inferior
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    themeSwitch: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignSelf: 'center',
      minWidth: 80,
    },
    themeSwitchLabel: {
      fontSize: 18,
      marginRight: 8,
    },
    switch: {
      transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    },
    form: {
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      color: colors.text,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    helperText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    toggleButton: {
      marginTop: 20,
      alignItems: 'center',
    },
    toggleText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    demoSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed',
    },
    demoSectionPressed: {
      backgroundColor: colors.primaryLight,
      transform: [{ scale: 0.98 }],
    },
    demoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    demoText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
      textAlign: 'center',
    },
    demoCredentialsContainer: {
      alignItems: 'center',
    },
    demoCredentials: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      textAlign: 'center',
      marginBottom: 8,
      minWidth: '100%',
    },
    demoHint: {
      fontSize: 12,
      color: colors.primary,
      fontStyle: 'italic',
      opacity: 0.8,
    },
  });
