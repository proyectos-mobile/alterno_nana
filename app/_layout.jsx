import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import CustomAlertProvider from '../components/CustomAlert';
import LoginScreen from '../components/LoginScreen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import '../locales'; // Importar configuración de i18n

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <CustomAlertProvider>
            <AppContent />
          </CustomAlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
