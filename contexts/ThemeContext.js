import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system');
  const [isDark, setIsDark] = useState(false);

  const loadThemePreference = useCallback(async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'system') {
          setIsDark(Appearance.getColorScheme() === 'dark');
        } else {
          setIsDark(savedTheme === 'dark');
        }
      } else {
        // Por defecto usar tema del sistema
        setIsDark(Appearance.getColorScheme() === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setIsDark(Appearance.getColorScheme() === 'dark');
    }
  }, []);

  useEffect(() => {
    // Cargar preferencia guardada
    loadThemePreference();

    // Escuchar cambios en el tema del sistema
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription?.remove();
  }, [theme, loadThemePreference]);

  const changeTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setTheme(newTheme);

      if (newTheme === 'system') {
        setIsDark(Appearance.getColorScheme() === 'dark');
      } else {
        setIsDark(newTheme === 'dark');
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const colors = {
    light: {
      primary: '#059669',
      primaryLight: '#dcfce7',
      secondary: '#2563EB',
      background: '#ffcba4',
      surface: '#ffffff',
      text: '#111827',
      textSecondary: '#6b7280',
      textTertiary: '#9ca3af',
      border: '#e5e7eb',
      borderLight: '#f3f4f6',
      success: '#059669',
      danger: '#DC2626',
      error: '#DC2626',
      errorLight: '#fef2f2',
      warning: '#D97706',
      overlay: 'rgba(255, 203, 164, 0.8)',
    },
    dark: {
      primary: '#10b981',
      primaryLight: '#064e3b',
      secondary: '#3b82f6',
      background: '#0b1215',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      textTertiary: '#64748b',
      border: '#334155',
      borderLight: '#475569',
      success: '#10b981',
      danger: '#ef4444',
      error: '#ef4444',
      errorLight: '#450a0a',
      warning: '#f59e0b',
      overlay: 'rgba(11, 18, 21, 0.8)',
    },
  };

  const currentColors = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        colors: currentColors,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
