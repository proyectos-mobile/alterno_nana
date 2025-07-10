/*
  # Función helper para RLS Multi-tenant
  
  Esta función permite establecer el email del usuario actual
  para que las políticas RLS puedan funcionar correctamente.
*/

-- Función para establecer el email del usuario actual
CREATE OR REPLACE FUNCTION set_current_user_email(email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Establecer el email en la configuración de la sesión
  PERFORM set_config('app.current_user_email', email, false);
END;
$$;
