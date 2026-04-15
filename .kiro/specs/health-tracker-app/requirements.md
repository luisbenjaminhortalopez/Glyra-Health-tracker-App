# Documento de Requisitos

## Introducción

Aplicación móvil de seguimiento de salud desarrollada en React Native para Android con un backend en Node.js. La aplicación permite a los usuarios registrar y monitorear tres métricas de salud: glucosa en sangre, presión arterial y peso corporal. Los datos se almacenan localmente mediante una base de datos SQLite para garantizar la persistencia sin conexión a internet. La interfaz está diseñada para ser simple e intuitiva, accesible para personas sin experiencia previa en tecnología, utilizando un estilo visual moderno de glassmorphism (vidrio esmerilado) y la tipografía Nunito Sans.

## Glosario

- **App**: La aplicación móvil de seguimiento de salud desarrollada en React Native
- **Usuario**: Persona que utiliza la App para registrar sus métricas de salud
- **Pantalla_Bienvenida**: Vista inicial que se muestra al Usuario en el primer uso de la App
- **Vista_Principal**: Vista central que muestra los tres módulos de salud disponibles
- **Módulo_Glucosa**: Componente de la App dedicado al registro y análisis de niveles de glucosa en sangre
- **Módulo_Presión**: Componente de la App dedicado al registro y análisis de presión arterial
- **Módulo_Peso**: Componente de la App dedicado al registro y análisis de peso corporal
- **Modal_Registro**: Ventana emergente utilizada para capturar nuevos datos de medición o editar datos existentes
- **Modal_Edición**: Ventana emergente pre-rellenada con los datos de un registro existente, utilizada para modificar datos incorrectos
- **Base_Datos_Local**: Base de datos SQLite embebida en el dispositivo para almacenamiento persistente
- **Clasificador_Glucosa**: Componente lógico que determina el estado de salud según el nivel de glucosa y el contexto de la medición
- **Conversor_Glucosa**: Componente lógico que convierte valores de glucosa entre unidades mmol/L y mg/dL
- **Sistema_Alertas**: Componente que genera notificaciones visuales basadas en los valores de glucosa registrados
- **mmol/L**: Milimoles por litro, unidad de medida de glucosa en sangre
- **mg/dL**: Miligramos por decilitro, unidad de medida alternativa de glucosa en sangre
- **Ayuno**: Estado en el que el Usuario no ha consumido alimentos durante 8 o más horas
- **Post-comida**: Estado en el que han transcurrido entre 1 y 2 horas desde la última comida del Usuario
- **Hipoglucemia**: Condición en la que el nivel de glucosa es inferior a 70 mg/dL (3.9 mmol/L)
- **Glassmorphism**: Estilo de diseño visual que simula vidrio esmerilado con transparencia, desenfoque de fondo y bordes sutiles
- **Backend_Node**: Servidor backend desarrollado en Node.js que gestiona la lógica de negocio y la comunicación con la Base_Datos_Local

## Requisitos

### Requisito 12: Diseño de Interfaz y Experiencia de Usuario

**Historia de Usuario:** Como Usuario sin experiencia previa en tecnología, quiero una interfaz simple, moderna y visualmente atractiva, para poder usar la App sin dificultad.

#### Criterios de Aceptación

1. THE App SHALL utilizar un diseño de estilo glassmorphism (vidrio esmerilado) con fondos translúcidos, desenfoque (blur) y bordes sutiles en todos los componentes principales (tarjetas, modales, botones)
2. THE App SHALL utilizar la tipografía Nunito Sans como fuente principal en toda la interfaz
3. THE App SHALL utilizar Nunito Sans Bold para todos los títulos y encabezados
4. THE App SHALL presentar una navegación intuitiva con etiquetas claras, iconos descriptivos y flujos de interacción lineales que no requieran conocimiento técnico previo
5. THE App SHALL mantener consistencia visual en colores, espaciado y tamaños de fuente a lo largo de todas las pantallas

### Requisito 13: Arquitectura Backend

**Historia de Usuario:** Como desarrollador, quiero que el backend esté construido en Node.js, para mantener un stack tecnológico unificado en JavaScript.

#### Criterios de Aceptación

1. THE Backend_Node SHALL estar desarrollado en Node.js como servidor de la aplicación
2. THE Backend_Node SHALL exponer una API REST para la comunicación con el frontend React Native
3. THE Backend_Node SHALL gestionar las operaciones de lectura y escritura contra la Base_Datos_Local

### Requisito 1: Configuración Inicial

**Historia de Usuario:** Como Usuario, quiero ingresar mi nombre la primera vez que abro la App, para que la experiencia sea personalizada.

#### Criterios de Aceptación

1. WHEN el Usuario abre la App por primera vez, THE Pantalla_Bienvenida SHALL mostrarse solicitando el nombre del Usuario
2. WHEN el Usuario ingresa un nombre válido (entre 1 y 50 caracteres) y confirma, THE App SHALL almacenar el nombre en la Base_Datos_Local y navegar a la Vista_Principal
3. IF el Usuario intenta confirmar sin ingresar un nombre, THEN THE Pantalla_Bienvenida SHALL mostrar un mensaje de error indicando que el nombre es obligatorio
4. WHEN el Usuario abre la App después de haber completado la configuración inicial, THE App SHALL navegar directamente a la Vista_Principal sin mostrar la Pantalla_Bienvenida

### Requisito 2: Vista Principal

**Historia de Usuario:** Como Usuario, quiero ver una pantalla principal con acceso a los tres módulos de salud, para poder navegar fácilmente al módulo que necesito.

#### Criterios de Aceptación

1. THE Vista_Principal SHALL mostrar tres botones con bordes redondeados dispuestos en columna vertical con las etiquetas "Glucosa", "Presión" y "Peso"
2. WHEN el Usuario presiona el botón "Glucosa", THE App SHALL navegar al Módulo_Glucosa
3. WHEN el Usuario presiona el botón "Presión", THE App SHALL navegar al Módulo_Presión
4. WHEN el Usuario presiona el botón "Peso", THE App SHALL navegar al Módulo_Peso

### Requisito 3: Registro de Glucosa

**Historia de Usuario:** Como Usuario, quiero registrar mis mediciones de glucosa con contexto de comida, para poder hacer seguimiento de mis niveles de glucosa en sangre.

#### Criterios de Aceptación

1. THE Módulo_Glucosa SHALL mostrar una tabla con los registros de glucosa existentes, incluyendo fecha, valor y estado de clasificación
2. THE Módulo_Glucosa SHALL mostrar un botón con la etiqueta "Registrar toma de glucosa" en la parte superior de la vista
3. WHEN el Usuario presiona el botón "Registrar toma de glucosa", THE App SHALL abrir el Modal_Registro con campos para: fecha, hora, indicador de comida previa (sí/no), tiempo transcurrido desde la comida (en horas), y valor de medición en mmol/L. El campo de fecha SHALL tener como valor predeterminado la fecha actual, pero el Usuario puede modificarla
4. WHEN el Usuario indica que hubo comida previa, THE Modal_Registro SHALL mostrar el campo de tiempo transcurrido desde la comida
5. WHEN el Usuario indica que no hubo comida previa, THE Modal_Registro SHALL ocultar el campo de tiempo transcurrido desde la comida
6. WHEN el Usuario confirma un registro con todos los campos obligatorios completos, THE Módulo_Glucosa SHALL almacenar el registro en la Base_Datos_Local y actualizar la tabla de registros
7. WHEN el Usuario selecciona un registro existente de la tabla, THE App SHALL abrir el Modal_Edición pre-rellenado con los datos del registro seleccionado (obtenidos mediante consulta por ID), permitiendo al Usuario modificar cualquier campo
8. WHEN el Usuario confirma los cambios en el Modal_Edición, THE Módulo_Glucosa SHALL actualizar el registro en la Base_Datos_Local y refrescar la tabla de registros
9. WHEN el Usuario solicita eliminar un registro de glucosa, THE Módulo_Glucosa SHALL eliminar el registro de la Base_Datos_Local y actualizar la tabla de registros

### Requisito 4: Conversión de Unidades de Glucosa

**Historia de Usuario:** Como Usuario, quiero que mis mediciones en mmol/L se conviertan automáticamente a mg/dL, para poder interpretar los resultados en ambas unidades.

#### Criterios de Aceptación

1. WHEN el Usuario registra un valor de glucosa en mmol/L, THE Conversor_Glucosa SHALL calcular el valor equivalente en mg/dL multiplicando el valor en mmol/L por 18
2. THE Conversor_Glucosa SHALL mostrar ambos valores (mmol/L y mg/dL) en cada registro de la tabla
3. FOR ALL valores válidos de glucosa, convertir de mmol/L a mg/dL y luego de mg/dL a mmol/L SHALL producir un valor equivalente al original (propiedad de ida y vuelta)

### Requisito 5: Clasificación de Glucosa

**Historia de Usuario:** Como Usuario, quiero ver un indicador de estado en cada registro de glucosa, para saber si mis niveles están dentro de rangos saludables.

#### Criterios de Aceptación

1. WHILE el contexto de medición es Ayuno (8 o más horas sin comida), THE Clasificador_Glucosa SHALL clasificar el registro como "Normal" cuando el valor está entre 70 y 99 mg/dL (3.9–5.5 mmol/L)
2. WHILE el contexto de medición es Ayuno, THE Clasificador_Glucosa SHALL clasificar el registro como "Prediabetes" cuando el valor está entre 100 y 125 mg/dL (5.6–6.9 mmol/L)
3. WHILE el contexto de medición es Ayuno, THE Clasificador_Glucosa SHALL clasificar el registro como "Diabetes" cuando el valor es igual o superior a 126 mg/dL (7.0 mmol/L)
4. WHILE el contexto de medición es Post-comida (1 a 2 horas después de comer), THE Clasificador_Glucosa SHALL clasificar el registro como "Normal" cuando el valor es inferior a 140 mg/dL (7.8 mmol/L)
5. WHILE el contexto de medición es Post-comida, THE Clasificador_Glucosa SHALL clasificar el registro como "Elevado" cuando el valor está entre 140 y 199 mg/dL (7.8–11.0 mmol/L)
6. WHILE el contexto de medición es Post-comida, THE Clasificador_Glucosa SHALL clasificar el registro como "Diabetes" cuando el valor es igual o superior a 200 mg/dL (11.1 mmol/L)
7. THE Clasificador_Glucosa SHALL clasificar el registro como "Hipoglucemia" cuando el valor es inferior a 70 mg/dL (3.9 mmol/L), independientemente del contexto de comida

### Requisito 6: Métricas y Gráficos de Glucosa

**Historia de Usuario:** Como Usuario, quiero ver métricas resumidas y gráficos de mis niveles de glucosa, para identificar tendencias y picos en mis mediciones.

#### Criterios de Aceptación

1. THE Módulo_Glucosa SHALL mostrar el promedio semanal de glucosa calculado a partir de los registros de los últimos 7 días
2. THE Módulo_Glucosa SHALL mostrar el valor máximo de glucosa registrado en los últimos 7 días
3. THE Módulo_Glucosa SHALL mostrar una tendencia (ascendente o descendente) basada en la comparación del promedio de la semana actual con el de la semana anterior
4. THE Módulo_Glucosa SHALL mostrar un gráfico simple que visualice los picos de glucosa a lo largo del tiempo

### Requisito 7: Alertas Inteligentes de Glucosa

**Historia de Usuario:** Como Usuario, quiero recibir alertas visuales cuando mis niveles de glucosa estén en rangos peligrosos, para poder tomar acción oportuna.

#### Criterios de Aceptación

1. WHEN el Usuario registra un valor de glucosa inferior a 70 mg/dL (3.9 mmol/L), THE Sistema_Alertas SHALL mostrar una alerta roja de Hipoglucemia
2. WHEN el Usuario registra valores superiores a 140 mg/dL (7.8 mmol/L) en contexto Post-comida de forma frecuente (3 o más veces en 7 días), THE Sistema_Alertas SHALL mostrar una alerta amarilla indicando elevación frecuente post-comida
3. WHEN el Usuario registra valores superiores a 180 mg/dL (10.0 mmol/L) de forma frecuente (3 o más veces en 7 días), THE Sistema_Alertas SHALL mostrar una alerta amarilla indicando niveles altos frecuentes
4. WHEN el Usuario registra un valor de glucosa igual o superior a 200 mg/dL (11.1 mmol/L), THE Sistema_Alertas SHALL mostrar una alerta seria indicando nivel crítico

### Requisito 8: Módulo de Presión Arterial

**Historia de Usuario:** Como Usuario, quiero registrar y monitorear mis mediciones de presión arterial, para hacer seguimiento de mi salud cardiovascular.

#### Criterios de Aceptación

1. THE Módulo_Presión SHALL mostrar una tabla con los registros de presión arterial existentes, incluyendo fecha, valores sistólica/diastólica y pulso
2. THE Módulo_Presión SHALL mostrar un botón "Registrar presión arterial" en la parte superior de la vista
3. WHEN el Usuario presiona el botón de registro, THE App SHALL abrir el Modal_Registro con campos para: fecha, hora, presión sistólica (mmHg), presión diastólica (mmHg) y pulso (bpm). El campo de fecha SHALL tener como valor predeterminado la fecha actual, pero el Usuario puede modificarla
4. WHEN el Usuario confirma un registro con todos los campos obligatorios completos, THE Módulo_Presión SHALL almacenar el registro en la Base_Datos_Local y actualizar la tabla
5. WHEN el Usuario selecciona un registro existente de la tabla, THE App SHALL abrir el Modal_Edición pre-rellenado con los datos del registro seleccionado (obtenidos mediante consulta por ID), permitiendo al Usuario modificar cualquier campo
6. WHEN el Usuario confirma los cambios en el Modal_Edición, THE Módulo_Presión SHALL actualizar el registro en la Base_Datos_Local y refrescar la tabla de registros
7. WHEN el Usuario solicita eliminar un registro de presión arterial, THE Módulo_Presión SHALL eliminar el registro de la Base_Datos_Local y actualizar la tabla de registros
8. THE Módulo_Presión SHALL mostrar métricas mensuales incluyendo promedio de presión sistólica, diastólica y pulso
9. THE Módulo_Presión SHALL mostrar un historial completo de registros con opción de visualización por mes
10. THE Módulo_Presión SHALL mostrar gráficos de tendencia de presión arterial a lo largo del tiempo

### Requisito 9: Módulo de Peso

**Historia de Usuario:** Como Usuario, quiero registrar mi peso y actividad física semanal, para monitorear mi progreso de salud corporal.

#### Criterios de Aceptación

1. THE Módulo_Peso SHALL mostrar una tabla con los registros de peso existentes, incluyendo fecha, peso y comentarios
2. THE Módulo_Peso SHALL mostrar un botón "Registrar peso" en la parte superior de la vista
3. WHEN el Usuario presiona el botón de registro, THE App SHALL abrir el Modal_Registro con campos para: fecha, peso (en kg) y comentarios opcionales. El campo de fecha SHALL tener como valor predeterminado la fecha actual, pero el Usuario puede modificarla
4. WHEN el Usuario confirma un registro con fecha y peso completos, THE Módulo_Peso SHALL almacenar el registro en la Base_Datos_Local y actualizar la tabla
5. WHEN el Usuario selecciona un registro existente de la tabla, THE App SHALL abrir el Modal_Edición pre-rellenado con los datos del registro seleccionado (obtenidos mediante consulta por ID), permitiendo al Usuario modificar cualquier campo
6. WHEN el Usuario confirma los cambios en el Modal_Edición, THE Módulo_Peso SHALL actualizar el registro en la Base_Datos_Local y refrescar la tabla de registros
7. WHEN el Usuario solicita eliminar un registro de peso, THE Módulo_Peso SHALL eliminar el registro de la Base_Datos_Local y actualizar la tabla de registros
8. THE Módulo_Peso SHALL mostrar una sección de seguimiento de ejercicio semanal con chips seleccionables para cada día de la semana (Lunes a Domingo)
9. WHEN el Usuario selecciona al menos un día de ejercicio, THE Módulo_Peso SHALL mostrar un campo para ingresar el promedio de actividad física diaria (en minutos)
10. WHEN el Usuario no tiene ningún día de ejercicio seleccionado, THE Módulo_Peso SHALL ocultar el campo de promedio de actividad física diaria
11. THE Módulo_Peso SHALL mostrar un historial completo de registros de peso con tendencia visual

### Requisito 10: Almacenamiento Local de Datos

**Historia de Usuario:** Como Usuario, quiero que todos mis datos de salud se almacenen de forma persistente en mi dispositivo, para no perder mi historial al cerrar la aplicación.

#### Criterios de Aceptación

1. THE Base_Datos_Local SHALL utilizar SQLite como motor de almacenamiento embebido en el dispositivo
2. THE Base_Datos_Local SHALL almacenar todos los registros de glucosa, presión arterial, peso y configuración del Usuario de forma persistente
3. WHEN la App se cierra y se vuelve a abrir, THE Base_Datos_Local SHALL mantener todos los datos previamente registrados sin pérdida de información
4. IF ocurre un error al escribir en la Base_Datos_Local, THEN THE App SHALL mostrar un mensaje de error descriptivo al Usuario e intentar preservar los datos no guardados

### Requisito 11: Generación de APK para Android

**Historia de Usuario:** Como Usuario, quiero instalar la aplicación en mi dispositivo Android, para poder usarla de forma nativa.

#### Criterios de Aceptación

1. THE App SHALL ser compilable como un archivo APK para la plataforma Android
2. THE App SHALL ser compatible con dispositivos Android versión 8.0 (API nivel 26) o superior
