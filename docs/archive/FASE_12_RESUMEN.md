# FASE 12 - Frontend Permisos y Filtros - RESUMEN DE IMPLEMENTACIÓN

**Fecha:** 17 de Noviembre, 2025
**Estado:** 90% Completado

---

## ✅ COMPLETADO

### 1. Tipos y Autenticación
- ✅ **types/index.ts**: Interfaces `User` y `UserProfile` actualizadas con nuevos roles y campos (`faculty_id`, `course_ids`, `first_login`)
- ✅ **hooks/useAuth.ts**: Agregadas funciones helper: `isSuperAdmin()`, `isUniversityAdmin()`, `isFacultyAdmin()`, `isProfessorAdmin()`, `isProfessor()`

### 2. Utilidades
- ✅ **utils/roleHelper.ts**: Helper completo creado con:
  - `getAdminPanelTitle()`: Títulos dinámicos según rol
  - `getVisibleTabs()`: Tabs filtrados por rol
  - `canCreateUsers()`, `getCreatableRoles()`: Permisos de creación
  - `getRoleDisplayName()`: Nombres legibles de roles

### 3. Componentes Principales
- ✅ **AdminPanel.tsx**:
  - Títulos y subtítulos dinámicos
  - Tabs filtrados usando roleHelper
  - Actualización automática cuando cambia el user

### 4. Managers Actualizados

#### ✅ CareersManager.tsx
- Auto-filtrado por `faculty_id` para faculty-admin
- Select de facultad oculto para faculty-admin
- Facultad mostrada como read-only
- Pre-llenado automático en creación

#### ✅ CoursesManager.tsx (Parcial)
- Variables de rol agregadas (`isFacultyAdmin`, `userFacultyId`)
- Filtros inicializados con `userFacultyId`

#### ✅ CommissionsManager.tsx (Parcial)
- Variables de rol agregadas (`isProfessorAdmin`, `isFacultyAdmin`, `userCourseIds`)
- Auto-filtrado por curso para professor-admin (si tiene 1 solo curso)

---

## ⏳ PENDIENTE

### 1. Finalizar CoursesManager
**Cambios necesarios:**
- [ ] useEffect para sincronizar filtros con `userFacultyId`
- [ ] Ocultar select de facultad para faculty-admin en filtros
- [ ] Mostrar facultad como read-only para faculty-admin
- [ ] Ocultar select de facultad en modal de creación para faculty-admin
- [ ] Pre-llenar `faculty_id` en handleCreate para faculty-admin

**Patrón a aplicar:** Igual que CareersManager

---

### 2. Finalizar CommissionsManager
**Cambios necesarios:**
- [ ] useEffect para sincronizar filtros
- [ ] Ocultar controles de universidad/facultad para faculty-admin
- [ ] Ocultar controles de universidad/facultad/carrera para professor-admin
- [ ] **Mostrar select de curso** para professor-admin (solo SUS cursos de `user.course_ids`)
- [ ] Si professor-admin tiene 1 curso: auto-seleccionar y ocultar filtro
- [ ] Si professor-admin tiene múltiples cursos: mostrar select de cursos
- [ ] En modal de creación:
  - Pre-llenar `course_id` para professor-admin
  - Solo mostrar cursos de sus `course_ids`
- [ ] Validar que la comisión pertenezca a uno de sus cursos antes de enviar

**Complejidad:** ALTA (rol más complejo del sistema)

---

### 3. RubricsManager
**Cambios necesarios:**
- [ ] Agregar variables: `isProfessorAdmin`, `isProfessor`, `userCourseIds`
- [ ] **IMPORTANTE**: Professor (normal) puede hacer CRUD de rúbricas de SUS comisiones
- [ ] Auto-filtrado por comisiones asignadas para professor (sin mostrar filtros)
- [ ] Para professor-admin: mostrar solo rúbricas de comisiones de SUS cursos
- [ ] En formulario de creación:
  - Professor: select de comisión solo muestra sus comisiones asignadas
  - Professor-admin: select de comisión solo muestra comisiones de sus cursos
- [ ] Validar permisos antes de enviar al backend

**Importancia:** ⭐ CRÍTICA (nuevo permiso para professor en V4)

---

### 4. UsersManager
**Cambios necesarios:**
- [ ] Agregar `'faculty-admin'` y `'professor-admin'` al select de roles
- [ ] Usar `getCreatableRoles(user)` para filtrar roles disponibles
- [ ] Para faculty-admin:
  - Puede crear: professor-admin, professor, user
  - Auto-filtrado por su facultad
  - Mostrar campo `faculty_id` en formulario
- [ ] Para professor-admin:
  - Puede crear: professor, user
  - NO puede crear otros professor-admin
  - Mostrar opción de asignar a comisiones de sus cursos
- [ ] Campo `course_ids` para crear professor-admin:
  - Select múltiple de cursos
  - Requerido (al menos 1)
  - Solo cursos de su alcance
- [ ] Campo `faculty_id` para crear faculty-admin:
  - Select de facultad
  - Requerido

**Importancia:** ⭐ ALTA (gestión de usuarios jerárquica)

---

## 📋 PATRÓN DE IMPLEMENTACIÓN APLICADO

```typescript
// 1. Variables de rol
const { user } = useAuth();
const isSuperAdmin = user?.role === 'super-admin';
const isFacultyAdmin = user?.role === 'faculty-admin';
const isProfessorAdmin = user?.role === 'professor-admin';
const userUniversityId = user?.university_id;
const userFacultyId = user?.faculty_id;
const userCourseIds = user?.course_ids || [];

// 2. Filtros auto-inicializados
const [filterFacultyId, setFilterFacultyId] = useState(userFacultyId || '');

// 3. useEffect para sincronizar
useEffect(() => {
  if (userFacultyId && !filterFacultyId) {
    setFilterFacultyId(userFacultyId);
  }
}, [userFacultyId]);

// 4. Ocultar controles en UI
{!isFacultyAdmin && (
  <select>...</select>
)}

// 5. Mostrar como read-only
{isFacultyAdmin && userFacultyId && (
  <div className="bg-bg-tertiary/50...">
    {facultyName}
  </div>
)}

// 6. Pre-llenar en creación
const handleCreate = () => {
  setFormData({
    ...
    faculty_id: userFacultyId || '',
    university_id: userUniversityId || ''
  });
};
```

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

1. **Finalizar CoursesManager** (15 min)
   - Aplicar patrón establecido
   - Similar a CareersManager

2. **Finalizar CommissionsManager** (30 min)
   - Implementar lógica especial para professor-admin
   - Select de cursos filtrado

3. **Actualizar RubricsManager** (45 min) ⭐ CRÍTICO
   - Implementar CRUD para professor
   - Filtrado por comisiones asignadas

4. **Actualizar UsersManager** (30 min)
   - Agregar nuevos roles a formulario
   - Validar permisos de creación

**Tiempo estimado total:** ~2 horas

---

## ✅ CRITERIOS DE COMPLETITUD

La FASE 12 estará 100% completa cuando:
- [ ] Todos los managers soporten los nuevos roles
- [ ] Professor puede hacer CRUD de rúbricas de sus comisiones
- [ ] Professor-admin puede gestionar comisiones y rúbricas de sus cursos
- [ ] Faculty-admin ve solo recursos de su facultad
- [ ] Filtros auto-inicializados funcionan correctamente
- [ ] Formularios pre-llenan campos según rol
- [ ] Se pueden crear usuarios con los nuevos roles

---

**Estado actual:** Fundamento completado (tipos, auth, helpers, AdminPanel).
Faltan ajustes finales en 4 managers.
