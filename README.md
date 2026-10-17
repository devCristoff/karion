<div align="center">

# ⏳ Kairon — Task & Challenge Planner

**Gestor integral de productividad personal, retos mensuales, matriz de priorización Eisenhower y tablero Kanban.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6%2F8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

[Características](#-características-principales) •
[Stack Tecnológico](#-stack-tecnológico) •
[Estructura del Proyecto](#-estructura-del-proyecto) •
[Instalación y Uso](#-instalación-y-uso) •
[Persistencia de Datos](#-persistencia-y-respaldo-de-datos) •
[Scripts Disponibles](#-scripts-disponibles)

---

</div>

## 📖 Descripción General

**Kairon** es una plataforma de productividad personal inspirada en el concepto griego de *Kairós* (el momento oportuno y cualitativo para actuar). Combina la gestión ágil de tareas diarias con el cumplimiento estructurado de hábitos y retos a mediano plazo, ayudando a mantener el enfoque en lo que verdaderamente genera impacto y minimizando la sobrecarga cognitiva.

Diseñado con una interfaz oscura minimalista (*Dark Modern*), rápida y fluida, Kairon ofrece múltiples perspectivas visuales para planificar, priorizar y ejecutar tus metas personales y profesionales.

---

## ✨ Características Principales

### 📊 1. Dashboard Analítico
* **KPIs en tiempo real**: Visualiza de inmediato la tasa de finalización de tareas, total de tareas activas y porcentaje de avance de los retos del mes.
* **Alertas de foco**: Acceso directo a tareas vencidas, próximas entregas y pendientes urgentes.
* **Métricas de balance**: Gráficos e indicadores de distribución por cuadrantes y categorías para auditar en qué inviertes tu tiempo.

### 🏆 2. Retos Mensuales (Monthly Challenges)
* **Tres modalidades de seguimiento adaptadas a cada tipo de objetivo**:
  * 📅 **Hábito Diario**: Calendario interactivo día a día para marcar constancia, visualizar rachas y medir adherencia al hábito.
  * 🔢 **Objetivo Numérico**: Medidor acumulativo con unidades configurables (páginas leídas, kilómetros recorridos, horas de estudio, etc.).
  * 🎯 **Hitos Secuenciales**: Lista de fases y entregables clave para proyectos por etapas.
* **Histórico y navegación mensual**: Explora el progreso de meses anteriores o planifica retos futuros.
* **Vinculación cruzada**: Asocia tareas específicas de tu To-Do directamente con un reto mensual.

### 🎯 3. Matriz de Priorización de Eisenhower
Clasifica visual e intuitivamente tus tareas según el cruce de Urgencia e Importancia en 4 cuadrantes operativos:
* **Q1 — Hacer Primero (Urgente e Importante)**: Crisis, problemas apremiantes y plazos inmediatos.
* **Q2 — Planificar & Agendar (No Urgente pero Importante)**: Crecimiento estratégico, salud, estudio y prevención (el cuadrante del alto rendimiento).
* **Q3 — Delegar & Asignar (Urgente pero No Importante)**: Interrupciones y tareas operativas delegables a colaboradores o agentes.
* **Q4 — Eliminar o Postergar (Ni Urgente Ni Importante)**: Distracciones y actividades sin valor real.
* Reasignación ágil de cuadrante con un solo clic y creación rápida contextual.

### 📋 4. Tablero Kanban Dinámico
* Flujo de trabajo visual distribuido en 4 estados estándar:
  * ⚪ **Por Hacer** (`todo`)
  * 🟡 **En Progreso** (`in_progress`)
  * 🔵 **En Revisión** (`review`)
  * 🟢 **Completadas** (`done`)
* Soporte nativo para arrastrar y soltar (*Drag & Drop*), búsqueda instantánea y filtrado por responsable asignado.

### ✅ 5. Lista To-Do Granular
* Gestión completa de tareas con:
  * Título, descripción y fecha límite (*Due Date*).
  * Prioridades categorizadas (`low`, `medium`, `high`, `urgent`).
  * Estimación de tiempo en minutos.
  * Etiquetas personalizadas y categorías temáticas.
  * Asignación a personas/agentes y vinculación a retos mensuales.
* Filtros rápidos por estado, urgencia y reto relacionado.

### 👥 6. Directorio de Personas y Agentes
* Directorio para delegación informativa y seguimiento de colaboradores:
  * 👤 Personas y amigos
  * 🤖 Agentes de IA
  * 💼 Colegas de trabajo
  * 🛠️ Servicios técnicos y proveedores
  * ❤️ Familiares
* Visualización de tareas activas por persona y protección de integridad referencial al eliminar un contacto.

### 💾 7. Persistencia Híbrida y Aislamiento por Usuario
* **Cero latencia**: Lectura y escritura instantánea en `localStorage` segmentado por usuario.
* **Sincronización en segundo plano**: Backend local integrado con SQLite (`data/kairon.db`) vía middleware de Vite en modo WAL (*Write-Ahead Logging*).
* **Seguridad y privacidad**: Sesiones protegidas por tokens Bearer y consultas transaccionales con total aislamiento entre cuentas.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología / Herramienta | Propósito |
| :--- | :--- | :--- |
| **Framework UI** | [React 19](https://react.dev/) | Arquitectura basada en componentes funcionales modernos y hooks reactivos |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | Tipado estático robusto y modelos de datos consistentes (`Task`, `Person`, `Challenge`) |
| **Build Tool & Servidor** | [Vite](https://vitejs.dev/) | Compilación ultrarrápida, HMR optimizado y middleware local para API REST (`/api/data`) |
| **Estilos & Diseño** | [Tailwind CSS v4](https://tailwindcss.com/) | Estilizado atómico moderno de alto rendimiento con tema oscuro personalizado |
| **Iconos & Animaciones** | [Lucide React](https://lucide.dev/) + [Motion](https://motion.dev/) | Iconografía nítida y transiciones fluidas de interfaz |
| **IA / LLM (Opcional)** | [@google/genai](https://www.npmjs.com/package/@google/genai) | Integración con la API de Google Gemini para capacidades inteligentes |
| **Tipografía** | Plus Jakarta Sans & JetBrains Mono | Legibilidad moderna en paneles numéricos y textos descriptivos |

---

## 📁 Estructura del Proyecto

```text
karion/
├── data/
│   └── kairon.db               # Base de datos SQLite local (better-sqlite3, modo WAL)
├── src/
│   ├── components/
│   │   ├── challenges/         # Vistas y modales de Retos Mensuales
│   │   │   ├── ChallengeList.tsx
│   │   │   └── ChallengeModal.tsx
│   │   ├── auth/               # Pantallas y formularios de autenticación (Login/Registro)
│   │   │   └── AuthView.tsx
│   │   ├── dashboard/          # Dashboard con métricas y analítica
│   │   │   └── AnalyticsDashboard.tsx
│   │   ├── eisenhower/         # Matriz de Eisenhower de 4 cuadrantes
│   │   │   └── EisenhowerMatrix.tsx
│   │   ├── kanban/             # Tablero visual Kanban con Drag & Drop
│   │   │   └── KanbanBoard.tsx
│   │   ├── layout/             # Sidebar colapsable y barra de navegación superior
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopHeader.tsx
│   │   ├── people/             # Directorio de personas, agentes y colaboradores
│   │   │   ├── PeopleManager.tsx
│   │   │   └── PersonModal.tsx
│   │   └── tasks/              # Lista To-Do detallada y formulario modal de tareas
│   │       ├── TaskModal.tsx
│   │       └── TodoList.tsx
│   ├── services/
│   │   └── storage.ts          # Servicio de persistencia híbrida (LocalStorage + API SQLite)
│   ├── types/
│   │   └── index.ts            # Definiciones de tipos e interfaces TypeScript del dominio
│   ├── App.tsx                 # Orquestador principal de estado y enrutamiento interno
│   ├── index.css               # Estilos globales y directivas de Tailwind CSS
│   └── main.tsx                # Punto de entrada de la aplicación React
├── server/
│   └── db.ts                   # Capa de base de datos SQLite (better-sqlite3, esquema, consultas preparadas)
├── .env.example                # Plantilla de variables de entorno (Gemini API, etc.)
├── index.html                  # Plantilla HTML base con fuentes y metadatos
├── metadata.json               # Configuración de capacidades y metadatos de la app
├── package.json                # Dependencias y scripts de ejecución
├── tsconfig.json               # Configuración del compilador TypeScript
└── vite.config.ts              # Configuración de Vite con plugins y middleware SQLite REST API
```

---

## 🚀 Instalación y Uso

### Prerrequisitos
* [Node.js](https://nodejs.org/) (versión 18.0 o superior recomendada).
* Gestor de paquetes: `npm`, `pnpm` o `yarn`.

### Pasos de Instalación

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/devCristoff/karion.git
   cd karion
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno** *(opcional si usas funciones de Gemini)*:
   ```bash
   cp .env.example .env.local
   ```
   Abre `.env.local` y añade tu clave si deseas integrar la API de Gemini:
   ```env
   GEMINI_API_KEY="tu_clave_de_gemini"
   ```

4. **Iniciar en modo desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se iniciará en `http://localhost:3000`.

---

## 💻 Scripts Disponibles

En el archivo [package.json](package.json) dispones de los siguientes comandos:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo Vite en el puerto `3000` con host `0.0.0.0`. |
| `npm run build` | Compila y empaqueta la aplicación optimizada para producción en `dist/`. |
| `npm run preview` | Previsualiza localmente el build de producción generado. |
| `npm run start` | Ejecuta la vista previa en el puerto `3000` accesible desde la red local. |
| `npm run lint` | Ejecuta la comprobación estricta de tipos de TypeScript sin emitir archivos (`tsc --noEmit`). |
| `npm run clean` | Limpia los directorios generados de compilación (`dist/` y `server.js`). |

---

## 🔄 Persistencia y Seguridad de Datos

Kairon implementa una arquitectura de doble persistencia diseñada para ofrecer la máxima velocidad sin riesgo de pérdida de información:

1. **Almacenamiento Local (`localStorage`)**: Todas las acciones (creación, edición, completado o movimiento de tareas) se reflejan al instante en la interfaz del navegador, segmentadas por ID de usuario.
2. **Base de Datos SQLite Local (`data/kairon.db`)**: En segundo plano, cada cambio se sincroniza con una base de datos relacional SQLite gestionada por `better-sqlite3` en modo WAL (*Write-Ahead Logging*). Soporta transacciones ACID, integridad referencial y consultas atómicas directas sin sobreescrituras completas de archivos.
3. **Seguridad sin Roles**: Arquitectura de aislamiento total donde cada usuario posee exclusivamente sus tareas, retos y directorio de personas, respaldado por autenticación criptográfica nativa (`scrypt`) y sesiones Bearer token.
4. **Migración Automática**: Al iniciar, Kairon detecta y migra automáticamente cualquier archivo legado `data/kairon_db.json` hacia `data/kairon.db` (SQLite). Una vez migrado, el archivo `.json` ya no se utiliza.

---

## 🤝 Contribución

Las contribuciones, sugerencias y mejoras son bienvenidas. Si deseas colaborar:
1. Haz un Fork del proyecto.
2. Crea una rama para tu función (`git checkout -b feature/nueva-funcionalidad`).
3. Confirma tus cambios (`git commit -m 'feat: agrega nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request describiendo tus modificaciones.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo correspondiente para más detalles.
