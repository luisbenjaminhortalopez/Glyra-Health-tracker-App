# Plan de Implementación: Health Tracker App

## Visión General

Implementación incremental de la aplicación de seguimiento de salud con React Native (frontend), Node.js + Express (backend) y SQLite (almacenamiento local). Se construye primero la capa de datos y lógica de negocio, luego la API REST, y finalmente el frontend con glassmorphism. Cada paso se valida con tests antes de avanzar.

## Tareas

- [x] 1. Configurar estructura del proyecto e instalar dependencias
  - [x] 1.1 Inicializar proyecto React Native con TypeScript y configurar estructura de carpetas
    - Crear proyecto React Native con template TypeScript
    - Crear carpetas: `src/screens`, `src/components`, `src/hooks`, `src/types`, `backend/src/controllers`, `backend/src/services`, `backend/src/routes`, `backend/src/db`
    - Instalar dependencias frontend: `react-navigation`, `@react-native-community/blur`, `react-native-chart-kit`
    - Instalar dependencias backend: `express`, `better-sqlite3`, `cors`
    - Instalar dependencias de testing: `jest`, `fast-check`, `@types/jest`, `ts-jest`
    - Configurar `tsconfig.json` para backend y frontend
    - _Requisitos: 11.1, 13.1_

  - [x] 1.2 Definir interfaces y tipos TypeScript compartidos
    - Crear archivo `src/types/index.ts` con todas las interfaces: `GlucoseRecord`, `GlucoseInput`, `GlucoseMetrics`, `GlucoseAlert`, `BloodPressureRecord`, `BloodPressureInput`, `BPMetrics`, `WeightRecord`, `WeightInput`, `ExerciseWeek`
    - Definir tipos: `MealContext`, `GlucoseClassification`, `AlertSeverity`, `AlertType`
    - _Requisitos: 3.1, 4.1, 8.1, 9.1_

- [x] 2. Implementar capa de datos SQLite
  - [x] 2.1 Crear módulo de inicialización de base de datos y esquema
    - Crear `backend/src/db/database.ts` con función de inicialización de SQLite
    - Implementar creación de tablas: `user_config`, `glucose_records`, `blood_pressure_records`, `weight_records`, `exercise_weekly`
    - Implementar manejo de errores de base de datos con mensajes descriptivos
    - _Requisitos: 10.1, 10.2, 10.4_

  - [x] 2.2 Implementar repositorio de usuario (`UserRepository`)
    - Crear `backend/src/db/userRepository.ts`
    - Implementar `getUser()`: obtener configuración del usuario
    - Implementar `createOrUpdateUser(name: string)`: validar longitud (1-50 chars) y guardar
    - _Requisitos: 1.1, 1.2, 1.3_

  - [x] 2.3 Implementar repositorio de glucosa (`GlucoseRepository`)
    - Crear `backend/src/db/glucoseRepository.ts`
    - Implementar CRUD completo: `getAll()`, `getById(id)`, `create(input)`, `update(id, input)`, `delete(id)`
    - Implementar `getRecordsByDateRange(startDate, endDate)` para métricas semanales
    - _Requisitos: 3.6, 3.7, 3.8, 3.9, 10.2_

  - [x] 2.4 Implementar repositorio de presión arterial (`BloodPressureRepository`)
    - Crear `backend/src/db/bloodPressureRepository.ts`
    - Implementar CRUD completo: `getAll()`, `getById(id)`, `create(input)`, `update(id, input)`, `delete(id)`
    - Implementar `getByMonth(month)` para filtrado y métricas mensuales
    - _Requisitos: 8.4, 8.5, 8.6, 8.7, 8.9, 10.2_

  - [x] 2.5 Implementar repositorio de peso (`WeightRepository`) y ejercicio (`ExerciseRepository`)
    - Crear `backend/src/db/weightRepository.ts` con CRUD completo
    - Crear `backend/src/db/exerciseRepository.ts` con `getWeek(weekStart)` y `updateWeek(input)`
    - _Requisitos: 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.2_


- [x] 3. Implementar lógica de negocio de glucosa
  - [x] 3.1 Implementar servicio de conversión de glucosa (`GlucoseConverterService`)
    - Crear `backend/src/services/glucoseConverter.ts`
    - Implementar `mmolToMgdl(mmol: number): number` → `mmol * 18`
    - Implementar `mgdlToMmol(mgdl: number): number` → `mgdl / 18`
    - _Requisitos: 4.1, 4.3_

  - [ ]* 3.2 Escribir test de propiedad para conversión de glucosa
    - **Propiedad 1: Round-trip de conversión de glucosa**
    - Para cualquier valor válido de glucosa en mmol/L, convertir a mg/dL y luego de vuelta a mmol/L debe producir un valor equivalente al original (epsilon ≤ 0.01)
    - Generador: `fc.float({ min: 0.1, max: 50.0 })`
    - **Valida: Requisitos 4.1, 4.3**

  - [x] 3.3 Implementar servicio de clasificación de glucosa (`GlucoseClassifierService`)
    - Crear `backend/src/services/glucoseClassifier.ts`
    - Implementar `classify(valueMgdl: number, context: MealContext): GlucoseClassification`
    - Hipoglucemia (< 70) tiene prioridad independiente del contexto
    - Ayuno: [70-99] Normal, [100-125] Prediabetes, [≥126] Diabetes
    - Post-comida: [70-139] Normal, [140-199] Elevado, [≥200] Diabetes
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 3.4 Escribir test de propiedad para clasificación de glucosa
    - **Propiedad 2: Clasificación correcta de glucosa según contexto y rango**
    - Para cualquier valor de glucosa y contexto, la clasificación debe retornar la categoría correcta según las reglas definidas
    - Generadores: `fc.float({ min: 0, max: 600 })`, `fc.constantFrom('fasting', 'post-meal')`
    - **Valida: Requisitos 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

  - [x] 3.5 Implementar servicio de alertas de glucosa (`GlucoseAlertService`)
    - Crear `backend/src/services/glucoseAlerts.ts`
    - Implementar `evaluateAlerts(record: GlucoseRecord, recentRecords: GlucoseRecord[]): GlucoseAlert[]`
    - Alerta roja: hipoglucemia (< 70 mg/dL)
    - Alerta roja: nivel crítico (≥ 200 mg/dL)
    - Alerta amarilla: elevación frecuente post-comida (> 140 mg/dL, 3+ veces en 7 días)
    - Alerta amarilla: niveles altos frecuentes (> 180 mg/dL, 3+ veces en 7 días)
    - _Requisitos: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 3.6 Escribir test de propiedad para alertas individuales de glucosa
    - **Propiedad 3: Alertas por valor individual de glucosa**
    - Para cualquier valor de glucosa: < 70 → alerta "hypoglycemia" roja; ≥ 200 → alerta "critical" roja; [70-199] → sin alerta individual
    - Generador: `fc.float({ min: 0, max: 600 })`
    - **Valida: Requisitos 7.1, 7.4**

  - [ ]* 3.7 Escribir test de propiedad para alertas de frecuencia de glucosa
    - **Propiedad 4: Alertas por frecuencia de glucosa**
    - Para cualquier conjunto de registros de 7 días: 3+ registros post-comida > 140 → alerta "frequent_post_meal_high" amarilla; 3+ registros > 180 → alerta "frequent_high" amarilla
    - Generador: `fc.array(glucoseRecordArbitrary, { minLength: 0, maxLength: 20 })`
    - **Valida: Requisitos 7.2, 7.3**

  - [x] 3.8 Implementar servicio de métricas (`MetricsService`)
    - Crear `backend/src/services/metricsService.ts`
    - Implementar `getWeeklyGlucoseMetrics(records)`: promedio semanal, valor máximo, tendencia
    - Implementar `getMonthlyBPMetrics(records)`: promedios mensuales de sistólica, diastólica y pulso
    - _Requisitos: 6.1, 6.2, 6.3, 8.8_

  - [ ]* 3.9 Escribir test de propiedad para métricas semanales de glucosa
    - **Propiedad 5: Métricas semanales de glucosa**
    - Para cualquier conjunto no vacío de registros, el promedio debe ser suma/cantidad y el máximo debe ser el mayor valor
    - Generador: `fc.array(fc.float({ min: 0.1, max: 600 }), { minLength: 1, maxLength: 50 })`
    - **Valida: Requisitos 6.1, 6.2**

  - [ ]* 3.10 Escribir test de propiedad para tendencia de glucosa
    - **Propiedad 6: Tendencia de glucosa**
    - Para cualquier par de promedios: actual > anterior → "ascending", actual < anterior → "descending", iguales → "stable"
    - Generador: `fc.float()` para ambos promedios
    - **Valida: Requisito 6.3**

  - [ ]* 3.11 Escribir test de propiedad para promedios mensuales de presión arterial
    - **Propiedad 10: Promedios mensuales de presión arterial**
    - Para cualquier conjunto no vacío de registros de presión, los promedios deben ser suma/cantidad para cada campo
    - Generador: `fc.array(bpRecordArbitrary, { minLength: 1, maxLength: 50 })`
    - **Valida: Requisito 8.8**

- [x] 4. Checkpoint - Verificar lógica de negocio
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.


- [x] 5. Implementar API REST del backend
  - [x] 5.1 Configurar servidor Express y middleware
    - Crear `backend/src/server.ts` con Express, cors y middleware de manejo de errores
    - Configurar rutas base: `/api/user`, `/api/glucose`, `/api/blood-pressure`, `/api/weight`, `/api/exercise`
    - _Requisitos: 13.1, 13.2_

  - [x] 5.2 Implementar controlador y rutas de usuario
    - Crear `backend/src/controllers/userController.ts`
    - Crear `backend/src/routes/userRoutes.ts`
    - `GET /api/user` → obtener configuración del usuario
    - `POST /api/user` → crear/actualizar nombre (validar 1-50 caracteres)
    - _Requisitos: 1.2, 1.3, 13.2, 13.3_

  - [ ]* 5.3 Escribir test de propiedad para validación de nombre de usuario
    - **Propiedad 12: Validación de nombre de usuario**
    - Para cualquier string de longitud 1-50: aceptar; para string vacío o > 50: rechazar
    - Generador: `fc.string({ minLength: 0, maxLength: 100 })`
    - **Valida: Requisitos 1.2, 1.3**

  - [x] 5.4 Implementar controlador y rutas de glucosa
    - Crear `backend/src/controllers/glucoseController.ts`
    - Crear `backend/src/routes/glucoseRoutes.ts`
    - CRUD: `GET /api/glucose`, `POST /api/glucose`, `GET /api/glucose/:id`, `PUT /api/glucose/:id`, `DELETE /api/glucose/:id`
    - Métricas: `GET /api/glucose/metrics`, Alertas: `GET /api/glucose/alerts`
    - Integrar `GlucoseConverterService`, `GlucoseClassifierService` y `GlucoseAlertService` en el flujo de creación/actualización
    - _Requisitos: 3.6, 3.7, 3.8, 3.9, 4.1, 4.2, 5.1-5.7, 6.1-6.4, 7.1-7.4, 13.2, 13.3_

  - [ ]* 5.5 Escribir test de propiedad para registros de glucosa con ambas unidades
    - **Propiedad 13: Registros de glucosa contienen ambas unidades y clasificación**
    - Para cualquier registro almacenado: debe contener mmol/L, mg/dL (= mmol/L × 18) y clasificación válida
    - Generador: `fc.float({ min: 0.1, max: 50.0 })` con contexto aleatorio
    - **Valida: Requisitos 3.1, 4.2**

  - [x] 5.6 Implementar controlador y rutas de presión arterial
    - Crear `backend/src/controllers/bloodPressureController.ts`
    - Crear `backend/src/routes/bloodPressureRoutes.ts`
    - CRUD: `GET /api/blood-pressure`, `POST /api/blood-pressure`, `GET /api/blood-pressure/:id`, `PUT /api/blood-pressure/:id`, `DELETE /api/blood-pressure/:id`
    - Métricas: `GET /api/blood-pressure/metrics`
    - _Requisitos: 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 13.2, 13.3_

  - [ ]* 5.7 Escribir test de propiedad para filtrado de registros por mes
    - **Propiedad 11: Filtrado de registros por mes**
    - Para cualquier conjunto de registros y un mes seleccionado, todos los registros devueltos deben pertenecer al mes y ninguno del mes debe quedar excluido
    - Generador: `fc.array(bpRecordArbitrary)` con fechas aleatorias
    - **Valida: Requisito 8.9**

  - [x] 5.8 Implementar controlador y rutas de peso y ejercicio
    - Crear `backend/src/controllers/weightController.ts` y `backend/src/routes/weightRoutes.ts`
    - CRUD peso: `GET /api/weight`, `POST /api/weight`, `GET /api/weight/:id`, `PUT /api/weight/:id`, `DELETE /api/weight/:id`
    - Crear `backend/src/controllers/exerciseController.ts` y `backend/src/routes/exerciseRoutes.ts`
    - Ejercicio: `GET /api/exercise`, `PUT /api/exercise`
    - _Requisitos: 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 13.2, 13.3_

  - [ ]* 5.9 Escribir tests de propiedad para persistencia CRUD
    - **Propiedad 7: Persistencia round-trip de registros (crear y leer por ID)**
    - Para cualquier registro válido, guardarlo y leerlo por ID debe producir datos equivalentes
    - **Propiedad 8: Round-trip de actualización de registros**
    - Para cualquier registro existente y campos actualizados, actualizar y leer debe reflejar los cambios
    - **Propiedad 9: Eliminación efectiva de registros**
    - Para cualquier registro existente, eliminarlo hace que no sea recuperable (404)
    - **Valida: Requisitos 3.6, 3.7, 3.8, 3.9, 8.4, 8.5, 8.6, 8.7, 9.4, 9.5, 9.6, 9.7, 10.2, 10.3**

- [x] 6. Checkpoint - Verificar backend completo
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.


- [x] 7. Implementar componentes UI reutilizables con glassmorphism
  - [x] 7.1 Configurar tema global y tipografía Nunito Sans
    - Crear `src/theme/index.ts` con colores, espaciado, tamaños de fuente y estilos de glassmorphism
    - Configurar carga de fuente Nunito Sans (Regular y Bold)
    - Definir estilos base para consistencia visual en toda la app
    - _Requisitos: 12.1, 12.2, 12.3, 12.5_

  - [x] 7.2 Implementar componentes base glassmorphism
    - Crear `src/components/GlassCard.tsx`: tarjeta con blur, transparencia y bordes sutiles
    - Crear `src/components/GlassButton.tsx`: botón con estilo glassmorphism y bordes redondeados
    - Crear `src/components/GlassModal.tsx`: modal con efecto glassmorphism para formularios
    - _Requisitos: 12.1, 12.4_

  - [x] 7.3 Implementar componentes de datos y visualización
    - Crear `src/components/RecordTable.tsx`: tabla genérica para registros de salud con selección de fila para edición
    - Crear `src/components/MetricCard.tsx`: tarjeta para métricas resumidas
    - Crear `src/components/AlertBanner.tsx`: banner de alerta con colores por severidad (rojo, amarillo)
    - Crear `src/components/WeekDayChips.tsx`: chips seleccionables para días de la semana
    - Crear `src/components/SimpleChart.tsx`: gráfico de líneas para tendencias
    - _Requisitos: 3.1, 6.4, 7.1, 8.1, 9.8, 12.1_

- [x] 8. Implementar hooks de comunicación con API
  - [x] 8.1 Crear hooks personalizados para cada módulo
    - Crear `src/hooks/useUser.ts`: obtener y guardar nombre de usuario
    - Crear `src/hooks/useGlucose.ts`: CRUD de glucosa, métricas y alertas
    - Crear `src/hooks/useBloodPressure.ts`: CRUD de presión arterial y métricas
    - Crear `src/hooks/useWeight.ts`: CRUD de peso
    - Crear `src/hooks/useExercise.ts`: obtener y actualizar ejercicio semanal
    - Configurar URL base del backend y manejo de errores de conexión
    - _Requisitos: 13.2, 10.4_

- [x] 9. Implementar pantallas del frontend
  - [x] 9.1 Implementar pantalla de bienvenida (`WelcomeScreen`)
    - Crear `src/screens/WelcomeScreen.tsx`
    - Campo de texto para nombre con validación (1-50 caracteres)
    - Mostrar mensaje de error si el nombre está vacío al confirmar
    - Navegar a Vista Principal al confirmar nombre válido
    - Verificar si el usuario ya existe al abrir la app (saltar bienvenida)
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

  - [x] 9.2 Implementar vista principal (`HomeScreen`)
    - Crear `src/screens/HomeScreen.tsx`
    - Tres botones en columna vertical: "Glucosa", "Presión", "Peso" con bordes redondeados
    - Navegación a cada módulo al presionar el botón correspondiente
    - Mostrar nombre del usuario como saludo personalizado
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_

  - [x] 9.3 Implementar módulo de glucosa (`GlucoseScreen`)
    - Crear `src/screens/GlucoseScreen.tsx`
    - Tabla de registros con fecha, valor (mmol/L y mg/dL) y clasificación
    - Botón "Registrar toma de glucosa" que abre modal de registro
    - Modal de registro: fecha (predeterminada: hoy), hora, comida previa (sí/no), tiempo desde comida (condicional), valor mmol/L
    - Al seleccionar registro → abrir modal de edición pre-rellenado (datos obtenidos por ID)
    - Opción de eliminar registro
    - Sección de métricas: promedio semanal, valor máximo, tendencia
    - Gráfico de picos de glucosa
    - Banners de alertas inteligentes
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.2, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

  - [x] 9.4 Implementar módulo de presión arterial (`BloodPressureScreen`)
    - Crear `src/screens/BloodPressureScreen.tsx`
    - Tabla de registros con fecha, sistólica/diastólica y pulso
    - Botón "Registrar presión arterial" que abre modal de registro
    - Modal de registro: fecha (predeterminada: hoy), hora, sistólica (mmHg), diastólica (mmHg), pulso (bpm)
    - Al seleccionar registro → abrir modal de edición pre-rellenado (datos obtenidos por ID)
    - Opción de eliminar registro
    - Métricas mensuales: promedios de sistólica, diastólica y pulso
    - Historial con visualización por mes
    - Gráficos de tendencia
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [x] 9.5 Implementar módulo de peso (`WeightScreen`)
    - Crear `src/screens/WeightScreen.tsx`
    - Tabla de registros con fecha, peso y comentarios
    - Botón "Registrar peso" que abre modal de registro
    - Modal de registro: fecha (predeterminada: hoy), peso (kg), comentarios opcionales
    - Al seleccionar registro → abrir modal de edición pre-rellenado (datos obtenidos por ID)
    - Opción de eliminar registro
    - Sección de ejercicio semanal: chips de días (Lunes-Domingo)
    - Campo de promedio de actividad diaria (minutos) visible solo si hay días seleccionados
    - Historial con tendencia visual
    - _Requisitos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11_

- [x] 10. Configurar navegación y conectar pantallas
  - [x] 10.1 Configurar React Navigation y flujo de la app
    - Crear `src/navigation/AppNavigator.tsx` con stack navigator
    - Configurar flujo: WelcomeScreen → HomeScreen → GlucoseScreen / BloodPressureScreen / WeightScreen
    - Implementar lógica de salto de bienvenida si el usuario ya existe
    - Conectar todas las pantallas con sus hooks de API
    - _Requisitos: 1.4, 2.1, 2.2, 2.3, 2.4, 12.4_

- [x] 11. Checkpoint - Verificar aplicación completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [x] 12. Configuración de build Android
  - [x] 12.1 Configurar generación de APK para Android
    - Configurar `android/build.gradle` con minSdkVersion 26 (Android 8.0)
    - Verificar configuración de React Native para compilación Android
    - Documentar comando de generación de APK: `cd android && ./gradlew assembleRelease`
    - _Requisitos: 11.1, 11.2_

- [x] 13. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedades validan propiedades universales de correctitud
- Los tests unitarios validan ejemplos específicos y casos borde
- El lenguaje de implementación es TypeScript tanto para frontend como backend
