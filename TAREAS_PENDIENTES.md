# 📋 TAREAS PENDIENTES - Papelería Nana App

_Última actualización: 9 de Julio, 2025_

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

### 2. 👤 Gestión de Perfil de Usuario

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

---

## 📱 MEJORAS FUTURAS (Opcional)

### 3. 🔍 Búsqueda y Filtros Avanzados

- Búsqueda de productos por nombre/categoría en EditVentaForm
- Filtros por fecha en reportes
- Búsqueda de ventas por cliente

### 4. 📊 Reportes Mejorados

- Gráficos de ventas por período
- Productos más vendidos
- Alertas de stock bajo automáticas

### 5. 🎨 UX/UI Improvements

- Animaciones de transición
- Modo offline básico
- Notificaciones push

### 6. 🔐 Seguridad Adicional

- Autenticación de dos factores
- Logs de auditoría
- Backup automático de datos

---

## 🗂️ ESTRUCTURA ACTUAL DEL PROYECTO

```
✅ Autenticación multi-tenant
✅ Gestión de productos (CRUD completo)
✅ Gestión de ventas (CRUD completo)
✅ Sistema de temas adaptativos
✅ Internacionalización (i18n)
✅ Alertas personalizadas
⚠️  Editar ventas (modal agregar productos con issue)
❌ Gestión de perfil de usuario
❌ Configuración de cuenta
```

---

## 🔄 PRÓXIMOS PASOS SUGERIDOS

1. **Prioridad ALTA:** Resolver issue del modal de agregar productos
2. **Prioridad MEDIA:** Implementar gestión de perfil de usuario
3. **Prioridad BAJA:** Mejoras de UX y funcionalidades adicionales

---

_Este archivo debe ser actualizado conforme se completen tareas y se identifiquen nuevos requerimientos._
