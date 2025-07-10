import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStoredSession = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('userSession');
      const tenantData = await AsyncStorage.getItem('tenantSession');

      if (userData && tenantData) {
        const parsedUser = JSON.parse(userData);
        const parsedTenant = JSON.parse(tenantData);

        setUser(parsedUser);
        setTenant(parsedTenant);

        // Establecer el email del usuario para las políticas RLS
        await supabase.rpc('set_current_user_email', {
          email: parsedUser.email,
        });
      }
    } catch {
      // Error silencioso en carga de sesión
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Cargar sesión guardada al iniciar
    loadStoredSession();
  }, [loadStoredSession]);

  const login = async (email, tenantSlug) => {
    try {
      setLoading(true);

      // Primero buscar el tenant por slug
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', tenantSlug)
        .single();

      if (tenantError || !tenantData) {
        throw new Error(
          `Papelería no encontrada. Error: ${tenantError?.message || 'No data'}`
        );
      }

      // Luego buscar el usuario en ese tenant
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('tenant_id', tenantData.id)
        .single();

      if (userError || !userData) {
        throw new Error(
          `Usuario no encontrado o credenciales incorrectas. Error: ${
            userError?.message || 'No data'
          }`
        );
      }

      if (!userData.activo) {
        throw new Error('Usuario inactivo');
      }

      if (!tenantData.activo) {
        throw new Error('Papelería inactiva');
      }

      // Establecer el email del usuario para las políticas RLS
      await supabase.rpc('set_current_user_email', { email });

      setUser(userData);
      setTenant(tenantData);

      // Guardar sesión
      await AsyncStorage.setItem('userSession', JSON.stringify(userData));
      await AsyncStorage.setItem('tenantSession', JSON.stringify(tenantData));

      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: error.message || 'Error al iniciar sesión',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Limpiar sesión
      await AsyncStorage.removeItem('userSession');
      await AsyncStorage.removeItem('tenantSession');

      setUser(null);
      setTenant(null);
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (tenantData, adminData) => {
    try {
      setLoading(true);

      // Crear nuevo tenant usando la función de la base de datos
      const { data, error } = await supabase.rpc('create_new_tenant', {
        p_slug: tenantData.slug,
        p_nombre: tenantData.nombre,
        p_email: adminData.email,
        p_admin_nombre: adminData.nombre,
        p_telefono: tenantData.telefono,
        p_direccion: tenantData.direccion,
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Error al crear la papelería');
      }

      // Iniciar sesión automáticamente después del registro
      return await login(adminData.email, tenantData.slug);
    } catch (error) {
      console.error('Error en register:', error);
      return {
        success: false,
        error: error.message || 'Error al registrar papelería',
      };
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTenantId = () => {
    const tenantId = tenant?.id || null;
    return tenantId;
  };

  const isAdmin = () => {
    return user?.rol === 'admin';
  };

  const value = {
    user,
    tenant,
    loading,
    login,
    logout,
    register,
    getCurrentTenantId,
    isAdmin,
    isAuthenticated: !!user && !!tenant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
