# Plan de Implementación: Sistema Integral RRHHCrux v2.0

Transformación y consolidación integral de la plataforma de Recursos Humanos **RRHHCrux**, implementando autenticación con contraseña en Kiosco Fichador, consolidación de Licencias y Solicitudes, migración de Procedimientos a Cartelera Digital, matriz interactiva de poderes y jerarquías entre cargos, reportes demográficos de nómina y gobierno estricto de visibilidad por rol.

---

## Decisiones Críticas y Preferencias Confirmadas

> [!IMPORTANT]
> **Decisiones confirmadas con el usuario en Fase 1:**
> - **Autenticación en Kiosco Fichador**: El colaborador debe ingresar su **contraseña individual de cuenta** para desbloquear la cámara y habilitar la captura de la selfie obligatoria.
> - **Consolidación de Módulos**: Vacaciones y Documentos se unifican bajo el nuevo módulo **"Licencias y Solicitudes"** con pestañas dedicadas para Vacaciones (con saldo disponible y adelantos), Licencias Médicas/Especiales, Trámites Documentales y Stock de Uniformes (solo visible para Administrador).
> - **Gobernanza y Jerarquías de Cargos**: Matriz interactiva de poderes y permisos por cargo (sin nombres fijos, gobernada por cargo) combinada con un árbol jerárquico multi-nivel donde los jefes y los jefes de jefes pueden delegar autorizaciones.
> - **Distribución Estricta de Módulos por Rol**:
>   - **Colaborador (10 módulos)**: Cartelera, Viandas, Horarios, Licencias y Solicitudes, Clima Laboral, Capacitaciones, Onboarding, Mi Legajo, Mis Recibos, Mis Evaluaciones.
>   - **Jefe (11 módulos)**: Los 10 de colaborador + Cajas Chicas y Facturas de Sector.
>   - **Administrador (19 módulos)**: Nómina completa con Bajas y Reportes, Control de Legajos, Liquidación SAC & Novedades, ATS Reclutamiento, Agente IA, Consolidado de Fichadas & Kiosco Admin, Configuración Integral de Módulos, Equipos & Jerarquías, Usuarios y Contraseñas, Estilos y Footer Legal.

---

## 1. Visión General & Arquitectura del Sistema

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             PLATAFORMA RRHHCRUX                                  │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌────────────────┐              ┌────────────────┐              ┌────────────────┐
│   COLABORADOR  │              │      JEFE      │              │  ADMINISTRADOR │
│  (10 Módulos)  │              │  (11 Módulos)  │              │  (19 Módulos)  │
├────────────────┤              ├────────────────┤              ├────────────────┤
│ • Cartelera    │              │ • Cartelera    │              │ • Nómina       │
│ • Viandas      │              │ • Viandas      │              │ • Bajas        │
│ • Horarios     │              │ • Horarios     │              │ • Legajos      │
│ • Licencias    │              │ • Licencias    │              │ • SAC/Novedad  │
│ • Clima        │              │ • Clima        │              │ • ATS Portal   │
│ • Capacitac.   │              │ • Capacitac.   │              │ • Kiosco Admin │
│ • Onboarding   │              │ • Onboarding   │              │ • Agente IA    │
│ • Mi Legajo    │              │ • Mi Legajo    │              │ • Liquidación  │
│ • Mis Recibos  │              │ • Mis Recibos  │              │ • Matriz Poder │
│ • Evaluación   │              │ • Evaluación   │              │ • Jerarquías   │
│                │              │ • Cajas Chicas │              │ • Config Mod   │
└────────────────┘              └────────────────┘              └────────────────┘
```

---

## 2. Experiencia de Usuario & Flujos Detallados por Módulo

### A. Terminal Kiosco Fichador & Control de Asistencia
1. **Flujo de Marcación con Contraseña Individual**:
   - El personal selecciona o ingresa su legajo.
   - Se despliega el campo de **Contraseña de Cuenta Individual**.
   - Solo al validar la contraseña correcta se enciende el visor de la cámara en vivo y se habilita el botón de captura de selfie.
   - La hora y fecha se extraen en tiempo real de forma bloqueada sin manipulación manual.
2. **Alertas Configurables por Admin**:
   - Umbral de **Llegada Tardía** (X minutos configurables).
   - Umbral de **Salida Anticipada** (X minutos configurables).
   - Umbral de **Fichada No Registrada** (si pasaron > X minutos de la hora pactada sin fichada, se emite una alerta prioritaria dirigida al Jefe del colaborador y al Admin).
3. **Privacidad y Aislamiento del Kiosco**:
   - Se elimina la pestaña de historial del Kiosco público.
   - El historial se traslada como pestaña protegida en **Horarios y Asistencia** (visible para Admin y Jefes con fotos ampliadas en alta resolución).
   - Se remueve el módulo de fichada de los menús de celular de empleados y jefes (solo operable desde la Tablet de sede).
   - El Admin no ficha desde el Kiosco; administra configuraciones e historiales desde el panel central.

### B. Módulo de Horarios & Feriados
1. **Control de Presets de Turnos por Admin**:
   - Edición de valores de horarios (agregar, eliminar o modificar turnos con entrada y salida HH:mm).
   - El nombre o denominación es opcional; lo indispensable son las horas de entrada y salida.
2. **Vistas Temporales Configurables**:
   - Selector de visualización en la planilla interactiva: **Semanal (7 días)**, **Quincenal (14 días)**, **Mensual (mes completo)** o **Rango Personalizado (X días)**.
3. **Descentralización y Multi-Sede sin Claves**:
   - Se elimina cualquier validación de clave por sede.
   - Los colaboradores con múltiples sedes asignadas pueden registrar inicio y fin en cualquier locación sin penalizaciones de ubicación, priorizando el cumplimiento horario.
4. **Filtros por Rol en Lista Detallada**:
   - **Empleado**: Únicamente filtro por fecha (se eliminan razón social, lugar y sector).
   - **Jefe**: Filtro por fecha + filtro por colaborador de su equipo.
   - **Admin**: Filtro completo por Razón Social, Sede, Sector, Colaborador y Rango de Fechas.

### C. Módulo Unificado: Licencias y Solicitudes
1. **Pestañas Integradas**:
   - **Vacaciones**: Muestra el saldo disponible en tiempo real. Bloquea solicitudes que superen los días disponibles.
   - **Adelanto de Vacaciones**: Permite solicitar días imputados al período vacacional siguiente, con firma requerida del Jefe y deducción automática en el ciclo posterior.
   - **Licencias Médicas y Especiales**: Carga de certificados en PDF/imagen con indicación de días.
   - **Trámites & Solicitudes de Documentos**: Certificados laborales, constancias de recibos y formularios con campos protegidos de nómina.
   - **Stock de Uniformes**: Visible de forma exclusiva para el rol Administrador.
2. **Leyes de Vacaciones y Reglas Flexibles**:
   - Mínimo legal configurable por país (ej. Argentina: 1 día cada 20 trabajados).
   - Admisión de beneficios empresariales más favorables (ej. 1 día cada 15 trabajados).
   - Régimen de excepciones individuales o por cargo para asignar días adicionales.

### D. Cartelera Digital: Procedimientos y Anuncios
1. **Sección de Procedimientos Operativos (SOP)**:
   - Los procedimientos se visualizan y descargan directamente desde la Cartelera.
   - Carga dual: redacción paso a paso en plataforma o archivo adjunto PDF.
   - Campos requeridos: Título, Categoría (menú desplegable), Sector (solo editable por Admin; los Jefes publican de forma automática para su equipo) y Descripción sintética.
2. **Notificaciones Automáticas**:
   - Toda publicación de anuncio o procedimiento despacha una notificación emergente a los destinatarios y al Administrador.

### E. Evaluaciones de Desempeño
1. **Firma Exclusiva del Empleado**:
   - El recuadro de firma del colaborador solo está habilitado cuando el usuario autenticado es el propio empleado evaluado.
2. **Campos Cualitativos Estructurados**:
   - 3 Puntos Destacados / Fortalezas.
   - Objetivos a Alcanzar en el Período.
   - Herramientas Concretas para el Colaborador.
   - Acciones Concretas de Mejora.
3. **Archivo Automático en Legajo**:
   - Al completarse ambas firmas (Jefe y Colaborador), el documento se archiva automáticamente en la carpeta de legajo digital del empleado.
4. **Historial por Rol**:
   - Colaborador: Historial de sus propias evaluaciones.
   - Jefe: Historial de evaluaciones de las personas a su cargo.
   - Admin: Historial transversal de toda la organización.

### F. Nómina de Personal, Bajas & Reportes Demográficos
1. **Pestaña de Bajas**:
   - Sección dedicada para archivar colaboradores desvinculados, preservando historial sin interferir en la nómina activa.
2. **Panel de Informes y Estadísticas**:
   - Cantidad de Madres y Padres de familia.
   - Distribución de Antigüedad.
   - Vacantes Activas vs. Vacantes Suspendidas.
   - Colaboradores en Período de Prueba con cuenta regresiva de días restantes para efectivización.
   - Filtros dinámicos por Razón Social, Sede de Trabajo y Sector.
3. **Restricción de Acceso**:
   - Módulo oculto para Jefes y Empleados (exclusivo para Administrador).

### G. Viandas & Comedor
1. **Pedidos por Jefatura**:
   - Los Jefes pueden solicitar viandas exclusivamente para los colaboradores de su equipo. El Admin puede pedir por cualquier usuario.
2. **Rol de Cocina**:
   - Permiso para cargar menú diario, consultar consolidado y **Cierre de Pedidos** (manual o corte automático X días antes).
   - Soporte para personal de cocina interno o concesionario tercerizado externo.

### H. Caja Chica & Tesorería
1. **Rol Tesorero Designado**:
   - El Administrador asigna uno o más usuarios (o externos) con el permiso de Tesorero.
   - Los Jefes solo ven la caja chica de su sector y las facturas cargadas por ellos.
   - El Tesorero y Admin supervisan todas las cajas y autorizan/ejecutan las reposiciones de fondos.

### I. Administración: Matriz de Poderes & Jerarquías de Cargos
1. **Matriz de Poderes por Cargo**:
   - Grilla interactiva de permisos donde cada cargo (sin nombres fijos) tiene casillas de verificación para módulos visibles, acciones de edición, pedidos de viandas, firma de solicitudes, rol Tesorero y rol Cocina.
2. **Árbol de Jerarquías Multi-Nivel**:
   - Define a qué cargos responde cada posición (permitiendo múltiples jefes directos y superiores jerárquicos).
   - Permite que el "jefe del jefe" autorice solicitudes cuando el supervisor directo está de licencia.

### J. Novedades y SAC (Sueldo Anual Complementario)
1. **Vinculación con Nómina**:
   - Se eliminan columnas duplicadas de filiación.
   - Se conecta automáticamente con ausencias, licencias aprobadas, adelantos de haberes, horas nocturnas y feriados.
2. **Panel "A Tener en Cuenta"**:
   - Lista automática de tardanzas y salidas anticipadas provenientes de las fichadas para decisión de presentismo o apercibimientos.
3. **Gestión de Feriados**:
   - Opción 1: Columnas automáticas por cada feriado del mes (ej. "12/10/2026") con marcas Sí/No.
   - Opción 2: Columna única sumatoria "Feriados Trabajados".
   - Opción 3: Omitir feriados.
4. **Grilla de SAC Semestral**:
   - Modo de vista semestral (6 meses) con sumatorias y promedios para liquidación del mejor sueldo del semestre y exportación a Excel.

### K. Recibos de Sueldo
- Los Jefes solo acceden a su recibo individual.
- Las métricas de cabecera (porcentajes globales de firmas) se muestran únicamente al Administrador.

### L. Estilos, Idiomas, Footer y Políticas Legales
1. **Selector de Idiomas Reactivo**: Español, Inglés y Portugués totalmente reactivos en todas las vistas.
2. **Selector de Tipografía y Tamaños**: Modificación visual en vivo de familias de fuentes y escalas de texto.
3. **Footer Institucional**:
   - Texto: `RRHHCrux © Todos los derechos reservados. Sistema integral de Recursos Humanos.`
   - Enlaces modales para **Términos y Condiciones de Uso** y **Política de Privacidad y Seguridad de Datos**.
4. **Usuarios de Prueba**: Perfiles pre-configurados para Tesorero, Cocina (interna y externa), Jefe, Colaborador y SuperAdmin.

---

## 3. Matriz de Componentes & Estado del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ESTADO GLOBAL (TenantContext)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ • employees (Activos & Bajas)          • pettyCashBoxes & Movements         │
│ • shifts & shiftPresets (Duraciones)   • cargoPowersMatrix (Poderes Cargo)  │
│ • clockPunches (Selfie + Clave)        • cargoHierarchyTree (Jerarquías)    │
│ • vacationBalances & Exceptions        • procedures (PDF / Pasos en Cart.)  │
│ • performanceEvaluations & Legajo Sync • sacReports (Mensual / Semestral)   │
│ • mealOrders & kitchenCutoffConfig     • branding (Fuentes, Modulos, Footer)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Estrategia de Verificación y Pruebas
1. **Fichador con Contraseña**: Validar que sin la clave individual del colaborador no se active la cámara ni se permita capturar la fotografía.
2. **Alertas Automáticas**: Comprobar que fichadas con tardanzas o ausencias mayores a los minutos fijados generen notificaciones para los jefes correspondientes.
3. **Consolidación de Licencias**: Verificar la visualización de saldo de vacaciones, validación de tope y generación de adelanto de vacaciones con firma.
4. **Matriz de Poderes & Jerarquías**: Simular un cargo dependiente de dos jefes y verificar que ambos puedan autorizar licencias y pedir viandas.
5. **Auditoría de Módulos por Rol**: Verificar que el Colaborador tenga exactamente 10 módulos, el Jefe 11 y el Administrador 19.
6. **Compilación y Linters**: Ejecutar `lint_applet` y `compile_applet` para garantizar cero errores de tipos y construcción limpia.
