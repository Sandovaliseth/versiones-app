# 🎯 Versiones App - Sistema Inteligente de Gestión de Versiones# Versiones App - Diseño Minimalista 2025 🎨



<div align="center">Sistema elegante y minimalista para gestión de versiones, diseñado como aplicación de escritorio siguiendo las tendencias de diseño de 2025.



![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)## ✨ Características Destacadas

![License](https://img.shields.io/badge/license-MIT-green.svg)

![React](https://img.shields.io/badge/React-18-61dafb.svg)### 🎨 Diseño Minimalista 2025

![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6db33f.svg)- **Bento Grid Layout**: Tarjetas con glassmorphism avanzado

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6.svg)- **Gradientes del Logo**: Colores rosa y morado (#e91e63, #9c27b0)

- **Tipografía Ultra Ligera**: Font-weight 300-400 para elegancia

**Sistema empresarial moderno para la gestión integral de versiones de software con arquitectura Full-Stack**- **Bordes Ultra Redondeados**: border-radius 24px+ en todos los componentes

- **Efectos de Profundidad**: Backdrop blur y sombras suaves modernas

[Características](#-características-principales) • [Tecnologías](#-stack-tecnológico) • [Instalación](#-instalación) • [Arquitectura](#-arquitectura) • [Documentación](#-api-documentation)- **Micro-interacciones**: Animaciones sutiles y fluidas



</div>### 🖥️ Aplicación de Escritorio

- **Tauri Framework**: Aplicación nativa de escritorio

---- **Sin Despliegue Web**: Funciona completamente offline

- **Rendimiento Optimizado**: Menor consumo de recursos que Electron

## 📋 Tabla de Contenidos- **Actualizaciones Automáticas**: Sistema de updates integrado



- [Descripción General](#-descripción-general)### 🛠️ Stack Tecnológico

- [Características Principales](#-características-principales)- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS

- [Stack Tecnológico](#-stack-tecnológico)- **Diseño**: Sistema moderno con CSS Variables y Glassmorphism

- [Arquitectura](#-arquitectura)- **Animaciones**: Framer Motion + Transiciones CSS avanzadas

- [Instalación](#-instalación)- **Desktop**: Tauri (Rust + WebView nativo)

- [Estructura del Proyecto](#-estructura-del-proyecto)- **Backend**: Spring Boot + Flyway + H2/PostgreSQL

- [Desarrollo](#-desarrollo)- **API**: REST con OpenAPI/Swagger

- [API Documentation](#-api-documentation)

- [Testing](#-testing)## 🚀 Inicio Rápido

- [Contribución](#-contribución)

- [Licencia](#-licencia)### Aplicación de Escritorio

```powershell

---cd frontend

# Configurar dependencias del sistema

## 🎯 Descripción General./desktop-setup.ps1 setup



**Versiones App** es un sistema empresarial integral diseñado para gestionar el ciclo completo de versiones de software, desde su creación como borrador hasta su certificación final. La aplicación implementa un flujo de trabajo estructurado que incluye creación, revisión, firma digital y certificación de versiones.# Inicializar Tauri (solo primera vez)

./desktop-setup.ps1 init

### 🎨 Diseño UI/UX Moderno 2025

# Ejecutar en desarrollo

El frontend implementa las últimas tendencias en diseño de interfaces:./desktop-setup.ps1 dev



- **🎭 Glassmorphism Avanzado**: Efectos de vidrio con `backdrop-blur` y transparencias# Construir para producción

- **✨ Bento Grid Layout**: Diseño modular con tarjetas inteligentes./desktop-setup.ps1 build

- **🌈 Sistema de Gradientes**: Paleta de colores vibrante (purple, pink, cyan, indigo)

- **🎬 Micro-animaciones**: Transiciones fluidas con Framer Motion
- **🌓 Modo Oscuro**: Tema claro/oscuro con transiciones suaves
- **📱 Responsive Design**: Adaptable a desktop, tablet y móvil
- **♿ Accesibilidad**: Navegación por teclado y ARIA labels

---

## 🚀 Características Principales

### 📦 Gestión de Versiones

- ✅ **Creación de Versiones**: Formulario intuitivo con validación en tiempo real
- 📝 **Estados del Ciclo de Vida**:
  - `BORRADOR`: Versión en proceso de creación
  - `LISTO`: Versión lista para firma
  - `CERTIFICADO`: Versión firmada y certificada
- 🔍 **Búsqueda y Filtrado**: Sistema de búsqueda avanzada por cliente, terminal, versión
- 📊 **Vista de Detalles**: Información completa con historial de cambios
- ✏️ **Edición Inline**: Actualización rápida de versiones existentes
- 🗑️ **Eliminación Segura**: Confirmación con modal antes de eliminar

### 🎨 Interfaz de Usuario

- **Dashboard Inteligente**:
  - Vista de tarjetas con glassmorphism
  - Estadísticas en tiempo real
  - Filtros dinámicos por estado
  - Badges de estado con colores semánticos

- **Sistema de Notificaciones**:
  - Toast notifications con animaciones
  - Tipos: Success, Error, Warning, Info
  - Auto-dismiss configurable
  - Stack inteligente (máximo 5 notificaciones)

- **Modales Interactivos**:
  - Crear versión con validación de campos
  - Ver detalles con información completa
  - Editar versión con confirmación
  - Diálogos de confirmación para acciones críticas

### 📊 Analíticas y Reportes

- 📈 **Métricas del Sistema**:
  - Total de versiones
  - Versiones por mes
  - Tiempo promedio de firma
  - Tasa de éxito

- 📉 **Gráficos Visuales**:
  - Barras animadas por mes
  - Estados actuales con porcentajes
  - Tendencias de crecimiento

### 🔧 Configuración

- ⚙️ **Configuración General**: Parámetros del sistema
- 👤 **Perfil de Usuario**: Gestión de datos personales
- 🔔 **Notificaciones**: Preferencias de alertas
- 🔒 **Seguridad**: Cambio de contraseña y 2FA
- 🎨 **Apariencia**: Temas y personalización

---

## 🛠️ Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **React** | 18.2.0 | Framework principal UI |
| **TypeScript** | 5.0.2 | Tipado estático |
| **Vite** | 4.5.14 | Build tool y dev server |
| **Tailwind CSS** | 3.4.0 | Framework CSS utility-first |
| **Framer Motion** | 10.x | Animaciones y transiciones |
| **React Router** | 6.20.0 | Enrutamiento SPA |
| **Heroicons** | 2.0.18 | Sistema de iconos |

### Backend

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Spring Boot** | 3.2.0 | Framework backend |
| **Java** | 17+ | Lenguaje del servidor |
| **Flyway** | 9.x | Migraciones de BD |
| **H2 Database** | 2.x | Base de datos en desarrollo |
| **PostgreSQL** | 15+ | Base de datos en producción |
| **Lombok** | 1.18.30 | Reducción de boilerplate |
| **OpenAPI** | 3.0 | Documentación API |

### DevOps & Tools

- **Docker**: Containerización de aplicaciones
- **Docker Compose**: Orquestación multi-container
- **Maven**: Gestión de dependencias Java
- **npm**: Gestión de dependencias Node
- **Git**: Control de versiones
- **ESLint**: Linting JavaScript/TypeScript
- **Prettier**: Formateo de código

---

## 🏗️ Arquitectura

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   React     │  │  Tailwind   │  │   Framer    │         │
│  │  Components │  │     CSS     │  │   Motion    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                 │                 │                │
│         └─────────────────┴─────────────────┘                │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │ React Router│                          │
│                    └──────┬──────┘                          │
│                           │                                  │
│                    ┌──────▼──────┐                          │
│                    │  API Client │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼──────────────────────────────────┘
                            │
                     HTTP/REST API
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Spring Boot Application                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │   REST   │  │ Business │  │   Data   │          │    │
│  │  │Controller│──│  Service │──│   Layer  │          │    │
│  │  └──────────┘  └──────────┘  └─────┬────┘          │    │
│  └────────────────────────────────────┼───────────────┘    │
│                                        │                     │
│                                 ┌──────▼──────┐             │
│                                 │   Flyway    │             │
│                                 │  Migrations │             │
│                                 └──────┬──────┘             │
│                                        │                     │
│                                 ┌──────▼──────┐             │
│                                 │   Database  │             │
│                                 │ H2/PostreSQL│             │
│                                 └─────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Arquitectura Frontend - Estructura de Componentes

```
src/
├── components/
│   ├── layout/           # Componentes de estructura
│   │   ├── MainLayout    # Layout principal con navegación
│   │   └── BentoNavbar   # Navbar con Bento grid menu
│   ├── ui/               # Componentes reutilizables
│   │   ├── Card          # Tarjeta con glassmorphism
│   │   ├── Button        # Botón con variantes
│   │   ├── Input         # Input con validación
│   │   ├── Badge         # Badge de estado
│   │   └── ToastManager  # Sistema de notificaciones
│   └── versiones/        # Componentes específicos
│       ├── CrearVersionModal
│       ├── VerVersionModal
│       └── EditarVersionModal
├── pages/                # Páginas principales
│   ├── Dashboard         # Vista principal
│   ├── Versions          # Gestión de versiones
│   ├── Analytics         # Reportes y métricas
│   └── Settings          # Configuración
├── services/             # Servicios API
│   └── versionService    # CRUD de versiones
├── types/                # TypeScript types
└── styles/               # Estilos globales
```

### Arquitectura Backend - Clean Architecture

```
com.lis.versions.versions_backend/
├── common/
│   ├── api/              # Global exception handlers
│   │   ├── GlobalExceptionHandler
│   │   ├── ApiError
│   │   └── ResourceNotFoundException
│   └── web/              # Filters y middleware
│       └── CorrelationIdFilter
├── versiones/
│   ├── api/              # REST Controllers & DTOs
│   │   ├── VersionController
│   │   └── VersionDtos
│   ├── app/              # Application Services
│   │   └── VersionService
│   ├── domain/           # Domain Models & Logic
│   │   ├── Version
│   │   └── VersionEstado
│   └── infra/            # Infrastructure
│       └── VersionRepository
└── resources/
    ├── application.yml   # Configuración
    └── db/migration/     # Scripts Flyway
        ├── V1__version_schema.sql
        ├── V2__artefacto_module.sql
        └── V3__borrador_module.sql
```

---

## 💻 Instalación

### Prerrequisitos

- **Node.js**: >= 18.0.0
- **Java JDK**: >= 17
- **Maven**: >= 3.8
- **Git**: >= 2.30
- **Docker** (opcional): >= 20.10

### Instalación Frontend

```bash
# Clonar el repositorio
git clone https://github.com/Sandovaliseth/versiones-app.git
cd versiones-app/frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Instalación Backend

```bash
# Navegar al directorio backend
cd backend/versions-backend

# Construir el proyecto
./mvnw clean install

# Ejecutar la aplicación
./mvnw spring-boot:run
```

El backend estará disponible en `http://localhost:8080`

### Instalación con Docker

```bash
# Desde la raíz del proyecto
cd infra

# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

---

## 📁 Estructura del Proyecto

```
versiones-app/
├── frontend/                    # Aplicación React
│   ├── public/                  # Archivos estáticos
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   ├── pages/               # Páginas de la app
│   │   ├── services/            # Servicios API
│   │   ├── styles/              # Estilos globales
│   │   ├── types/               # TypeScript types
│   │   ├── App.tsx              # Componente raíz
│   │   └── main.tsx             # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── backend/
│   └── versions-backend/        # API Spring Boot
│       ├── src/
│       │   ├── main/
│       │   │   ├── java/        # Código fuente
│       │   │   └── resources/   # Configuración
│       │   └── test/            # Tests
│       ├── pom.xml
│       └── Dockerfile
│
├── infra/                       # Infraestructura
│   ├── docker-compose.yml       # Orquestación Docker
│   └── .env.example             # Variables de entorno
│
├── docs/                        # Documentación
│   ├── design.md                # Diseño UI/UX
│   └── architecture.pdf         # Arquitectura técnica
│
└── README.md                    # Este archivo
```

---

## 🚀 Desarrollo

### Scripts Disponibles - Frontend

```json
{
  "dev": "vite",                    // Servidor de desarrollo
  "build": "tsc && vite build",     // Build de producción
  "preview": "vite preview",        // Preview del build
  "lint": "eslint . --ext ts,tsx",  // Linting
  "format": "prettier --write ."    // Formateo de código
}
```

### Ejecutar en Desarrollo

```bash
# Terminal 1 - Backend
cd backend/versions-backend
./mvnw spring-boot:run

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Build de Producción

```bash
# Frontend
cd frontend
npm run build
# Output en: frontend/dist/

# Backend
cd backend/versions-backend
./mvnw clean package
# Output en: target/versions-backend-0.0.1-SNAPSHOT.jar
```

---

## 📚 API Documentation

### Endpoints Principales

#### Versiones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/versiones` | Listar todas las versiones |
| `GET` | `/api/versiones/{id}` | Obtener versión por ID |
| `POST` | `/api/versiones` | Crear nueva versión |
| `PUT` | `/api/versiones/{id}` | Actualizar versión |
| `DELETE` | `/api/versiones/{id}` | Eliminar versión |
| `POST` | `/api/versiones/{id}/firmar` | Firmar versión |

#### Swagger UI

Documentación interactiva disponible en:
```
http://localhost:8080/swagger-ui.html
```

#### OpenAPI Spec

Especificación OpenAPI 3.0:
```
http://localhost:8080/v3/api-docs
```

### Ejemplo de Request

```bash
# Crear versión
curl -X POST http://localhost:8080/api/versiones \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": "Cliente Demo",
    "nombreVersionCliente": "v1.0.0",
    "terminal": "Terminal 1",
    "serie": "A001",
    "sistemaOperativo": "Windows 11",
    "versionSoftware": "2.5.1",
    "observaciones": "Release inicial"
  }'
```

---

## 🧪 Testing

### Frontend Tests

```bash
cd frontend

# Ejecutar tests unitarios
npm run test

# Tests con coverage
npm run test:coverage

# Tests E2E
npm run test:e2e
```

### Backend Tests

```bash
cd backend/versions-backend

# Ejecutar todos los tests
./mvnw test

# Tests con coverage
./mvnw verify

# Tests de integración
./mvnw integration-test
```

---

## 🎨 Guía de Estilo

### Convenciones de Código

- **TypeScript/React**: Seguir [Airbnb Style Guide](https://github.com/airbnb/javascript)
- **Java**: Seguir [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- **Commits**: Seguir [Conventional Commits](https://www.conventionalcommits.org/)

### Formato de Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

Tipos válidos:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bugs
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan el código)
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 Equipo

- **Desarrollador Principal**: @Sandovaliseth
- **Arquitecto de Software**: GitHub Copilot AI
- **Diseño UI/UX**: Sistema Bento Grid 2025

---

## 📞 Contacto

- **GitHub**: [@Sandovaliseth](https://github.com/Sandovaliseth)
- **Proyecto**: [versiones-app](https://github.com/Sandovaliseth/versiones-app)

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐**

Made with ❤️ by the Versiones App Team

</div>
