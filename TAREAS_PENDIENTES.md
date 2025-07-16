# 📋 TAREAS PENDIENTES - Papelería Nana App

_Última actualización: 16 de Julio, 2025_

## 🔧 PROBLEMAS ACTIVOS A RESOLVER

### 1. 🛠️ EditVentaForm - Modal de Agregar Productos

**Problema:** Al presionar "Agregar" en EditVentaForm, aparece solo el título del modal sin productos para seleccionar.

**Posibles causas:**

- Los productos no se están cargando correctamente desde `getProductos()`
- El array `productosDisponibles` está vacío
- Error en el filtro `productosNoEnVenta`
- Problema con el `FlatList` o su renderizado

**Debugging añadido:**

- Console.log temporal agregado en `renderProductSelector()` para verificar datos

**Siguiente paso:**

- Revisar logs en consola para confirmar si `productosDisponibles` tiene datos
- Verificar función `loadProductosDisponibles()`
- Revisar si `getProductos()` del hook funciona correctamente

---

## 🚀 FUNCIONALIDADES PENDIENTES

### 2. 🔐 Sistema de Autenticación Mejorado

**Descripción:** Migrar del sistema actual (email + papelería) a un sistema de autenticación robusto con contraseñas.

**Opciones a implementar:**

- **Autenticación tradicional:**
  - Email + contraseña
  - Validación segura de contraseñas
  - Reset de contraseña por email
- **Autenticación social (Supabase Auth):**
  - Login con Google
  - Login con Microsoft/Hotmail
  - Login con GitHub
  - Login con Apple (iOS)

**Beneficios:**

- Mayor seguridad
- Mejor experiencia de usuario
- Aprovecha el sistema nativo de Supabase Auth
- Soporte para múltiples proveedores

**Implementación sugerida:**

- Migrar a `supabase.auth` en lugar del sistema custom actual
- Mantener la estructura multi-tenant
- Agregar tabla `user_profiles` para datos adicionales

---

### 3. 💰 Sistema de Monetización

**Descripción:** Implementar modelo de negocio freemium con suscripciones.

**Estructura propuesta:**

- **Plan Gratuito:**

  - 1 papelería
  - Hasta 100 productos
  - Hasta 50 ventas por mes
  - Funcionalidades básicas

- **Plan Premium (Mensual/Anual):**
  - Papelerías ilimitadas
  - Productos ilimitados
  - Ventas ilimitadas
  - Reportes avanzados
  - Backup automático
  - Soporte prioritario

**Tecnologías a considerar:**

- Stripe para pagos
- RevenueCat para suscripciones
- In-App Purchases (iOS/Android)

**Rama sugerida:** `feature/monetization`

---

### 4. 👤 Gestión de Perfil de Usuario

**Descripción:** Implementar edición de datos de cuenta en la sección Configuración.

**Funcionalidades requeridas:**

- **Datos personales:**
  - Nombre completo
  - Email (solo lectura, ya que es el login)
  - Teléfono
  - Dirección
  - Ciudad/País
- **Datos de la papelería:**
  - Nombre del negocio
  - Dirección del negocio
  - Teléfono del negocio
  - Horarios de atención
  - Logo/imagen (opcional)

**Implementación sugerida:**

- Crear `ProfileForm.js` component
- Agregar campos a la tabla `profiles` en Supabase
- Integrar en la pantalla `configuracion.js`
- Usar el mismo patrón de UI que otros formularios (blur, temas, etc.)

---

## ✅ COMPLETADO RECIENTEMENTE

- ✅ **Sistema multi-tenant** completo con aislamiento de datos
- ✅ **EditVentaForm mejorado** con capacidad de agregar/eliminar productos
- ✅ **Gestión automática de stock** en edición de ventas
- ✅ **CustomAlert personalizado** que se adapta a temas
- ✅ **Traducciones i18n** completas (ES/EN)
- ✅ **Sistema de temas** (claro/oscuro) aplicado a toda la app
- ✅ **CRUD completo** de productos y ventas
- ✅ **Corrección de tenant_id** en todas las operaciones de base de datos
- ✅ **Correcciones de seguridad SQL** - Eliminados warnings con `SET search_path = public`

---

## 📱 MEJORAS FUTURAS (Opcional)

### 5. 🔍 Búsqueda y Filtros Avanzados

- Búsqueda de productos por nombre/categoría en EditVentaForm
- Filtros por fecha en reportes
- Búsqueda de ventas por cliente

### 6. 📊 Reportes Mejorados

- Gráficos de ventas por período
- Productos más vendidos
- Alertas de stock bajo automáticas

### 7. 🎨 UX/UI Improvements

- Animaciones de transición
- Modo offline básico
- Notificaciones push

### 8. 🔐 Seguridad Adicional

- Autenticación de dos factores (con nuevo sistema auth)
- Logs de auditoría
- Backup automático de datos

---

## 🗂️ ESTRUCTURA ACTUAL DEL PROYECTO

```
✅ Autenticación multi-tenant (custom)
✅ Gestión de productos (CRUD completo)
✅ Gestión de ventas (CRUD completo)
✅ Sistema de temas adaptativos
✅ Internacionalización (i18n)
✅ Alertas personalizadas
✅ Base de datos segura (sin warnings)
⚠️  Editar ventas (modal agregar productos con issue)
❌ Autenticación con contraseñas/OAuth
❌ Sistema de monetización
❌ Gestión de perfil de usuario
❌ Configuración de cuenta
```

---

## 🔄 PRÓXIMOS PASOS SUGERIDOS

1. **Prioridad ALTA:** Resolver issue del modal de agregar productos
2. **Prioridad ALTA:** Implementar sistema de autenticación mejorado
3. **Prioridad MEDIA:** Diseñar sistema de monetización
4. **Prioridad MEDIA:** Implementar gestión de perfil de usuario
5. **Prioridad BAJA:** Mejoras de UX y funcionalidades adicionales

---

_Este archivo debe ser actualizado conforme se completen tareas y se identifiquen nuevos requerimientos._
