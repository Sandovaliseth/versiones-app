# 🎯 Versiones App

<div align="center">

![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![Electron](https://img.shields.io/badge/Electron-38-47848F?style=flat-square&logo=electron)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-6db33f?style=flat-square&logo=springboot)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)

**Aplicación de escritorio para gestionar versiones de software**

Automatiza compilación, checksums, historial y correos en Outlook.

[Instalación](#-instalación) · [Características](#-características) · [Uso](#-uso)

</div>

---

## 📸 Capturas

### Dashboard principal
Gestiona todas tus versiones con filtros por estado (Borrador, Listo, Certificado).

![Dashboard](https://via.placeholder.com/800x450/1e1e2e/ffffff?text=Dashboard+con+filtros+y+b%C3%BAsqueda)

### Crear nueva versión
Modal con detección automática de `compile.py` y cálculo de checksums MD5.

![Crear Versión](https://via.placeholder.com/800x450/1e1e2e/ffffff?text=Modal+crear+versi%C3%B3n)

### Analíticas en tiempo real
Visualiza métricas, tendencias y estadísticas de tus versiones.

![Analytics](https://via.placeholder.com/800x450/1e1e2e/ffffff?text=Gr%C3%A1ficos+de+anal%C3%ADticas)

---

## ✨ Características

### 🔄 Flujo automatizado completo

1. **Crear versión** → Introduces datos básicos (cliente, terminal, versión)
2. **Detecta proyecto** → Busca automáticamente `compile.py`, `Makefile` o archivos `.bin`
3. **Compila BASE** → Ejecuta el comando de compilación
4. **Calcula MD5 BASE** → Checksum automático del binario
5. **Edita archivo .h** → Actualiza la versión en el código
6. **Compila AUMENTO** → Genera nueva versión
7. **Calcula MD5 AUMENTO** → Verifica que sea diferente a BASE
8. **Crea estructura** → Carpetas BASE/AUMENTO + Checksums.txt + ReleaseNotes.md
9. **Genera ZIP** → Comprime todo el historial
10. **Abre Outlook** → Correo automático con adjuntos listos para enviar

### 🎨 Interfaz moderna

- **Glassmorphism** → Efectos de vidrio y transparencias
- **Modo oscuro** → Detecta preferencia del sistema
- **Bento Grid** → Diseño modular con tarjetas
- **Animaciones suaves** → Framer Motion
- **Responsive** → Adapta a cualquier tamaño de ventana

### 🔐 Gestión de versiones

- **Estados:** Borrador → Listo → Certificado
- **Búsqueda avanzada** → Filtra por cliente, terminal, fecha
- **Edición inline** → Actualiza datos sin modal
- **Historial completo** → Todas las versiones guardadas en BD

### 🛠️ Compilación inteligente

- **Detección automática** → Busca `compile.py`, `Makefile`, archivos `.bin`
- **Múltiples modos** → Soporta Python scripts con menús interactivos
- **Monitoreo de archivos** → Detecta cuando termina la compilación
- **Validación** → Verifica que BASE ≠ AUMENTO (evita duplicados)

### 📦 Historial estructurado

```
OneDrive/Versiones/
└── VERSION_Cliente_v1.0.0_20251204/
    ├── BASE/
    │   └── firmware.bin
    ├── AUMENTO/
    │   └── firmware.bin
    ├── Checksums.txt
    ├── ReleaseNotes.md
    └── VERSION_Cliente_v1.0.0_20251204.zip
```

---

## 🚀 Instalación

### Requisitos

- **Node.js** 18+ ([descargar](https://nodejs.org/))
- **Java** 17+ ([descargar](https://adoptium.net/))
- **Maven** 3.8+ (incluido con Java)

### Clonar el repositorio

```bash
git clone https://github.com/Sandovaliseth/versiones-app.git
cd versiones-app
```

### Backend (Spring Boot API)

```bash
cd backend/versions-backend
./mvnw clean install
./mvnw spring-boot:run
```

✅ API corriendo en `http://localhost:8080`

### Frontend (Electron App)

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

✅ Aplicación Electron abierta automáticamente

---

## 💻 Uso

### Desarrollo

```bash
# Frontend con hot-reload
cd frontend
npm run dev

# Backend con auto-restart
cd backend/versions-backend
./mvnw spring-boot:run
```

### Producción

```bash
cd frontend
npm run desktop
```

Esto ejecuta:
1. `npm run build` → Compila TypeScript + Vite
2. `npm run pack` → Empaqueta en `.exe` (carpeta `dist-electron/`)
3. `npm run start` → Ejecuta el instalable

### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo con Electron + hot-reload |
| `npm run build` | Compila el código para producción |
| `npm run pack` | Empaqueta en ejecutable `.exe` |
| `npm run start` | Ejecuta el `.exe` empaquetado |
| `npm run desktop` | Flujo completo: build + pack + start |
| `npm run clean` | Limpia carpetas `dist/` y `dist-electron/` |

---

## 📝 Crear tu primera versión

### 1. Abre la aplicación

```bash
npm run dev
```

### 2. Click en "Nueva Versión"

Aparece el modal con el formulario.

### 3. Llena los campos básicos

- **Cliente:** Nombre del cliente (ej: "Bancolombia")
- **Nombre versión cliente:** Identificador (ej: "v2.5.1")
- **Terminal:** Modelo (ej: "VX520")
- **Versión base:** Número de versión (ej: "1.0.0")
- **Build:** Fecha automática (formato YYMMDD)

### 4. Configuración de compilación (opcional)

Si marcas **"Incluir versión AUMENTO"**:

- **Ruta del proyecto:** Carpeta donde está tu código
- **Comando compilación:** Se detecta automático (`py compile.py` o `make`)
- **Archivo versión:** `.h` con `#define VERSION` (se busca automático)
- **Versión aumento:** Nueva versión (ej: "1.0.1")

### 5. Click en "Crear"

La aplicación:

1. ✅ Compila la versión BASE
2. ✅ Calcula MD5 del binario
3. ✅ Guarda snapshot del binario BASE
4. ✅ Actualiza el archivo `.h` con nueva versión
5. ✅ Compila la versión AUMENTO
6. ✅ Calcula MD5 del nuevo binario
7. ✅ Verifica que BASE ≠ AUMENTO
8. ✅ Crea carpetas estructuradas
9. ✅ Genera `Checksums.txt` y `ReleaseNotes.md`
10. ✅ Comprime en ZIP
11. ✅ Abre Outlook con correo pre-llenado

### 6. Revisa el correo en Outlook

Aparece un borrador con:
- ✉️ Asunto: `[VERSION] Cliente - Terminal v1.0.0_20251204`
- 📎 Adjunto: `VERSION_Cliente_v1.0.0_20251204.zip`
- 📝 Cuerpo: Tabla HTML con checksums y detalles

Solo agrega destinatarios y envía.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│     Electron App (Frontend)          │
│  ┌────────────────────────────────┐ │
│  │  React + TypeScript + Tailwind │ │
│  │  ┌──────────────────────────┐  │ │
│  │  │ Dashboard │ Versions      │  │ │
│  │  │ Analytics │ Settings      │  │ │
│  │  └──────────────────────────┘  │ │
│  └────────────────────────────────┘ │
│                │                     │
│         ┌──────▼──────────┐         │
│         │ Electron IPC API │         │
│         └──────┬──────────┘         │
│                │                     │
│    ┌───────────▼───────────────┐    │
│    │ Sistema de archivos local │    │
│    │ - Leer/escribir .bin, .h  │    │
│    │ - Ejecutar compile.py     │    │
│    │ - Calcular MD5            │    │
│    │ - Integrar Outlook        │    │
│    └───────────────────────────┘    │
└─────────────────────────────────────┘
                │
         HTTP REST API
                │
┌───────────────▼─────────────────────┐
│   Spring Boot Backend (API)         │
│  ┌────────────────────────────────┐ │
│  │ REST Controllers               │ │
│  │  /api/versiones (CRUD)         │ │
│  └──────────┬─────────────────────┘ │
│             │                        │
│  ┌──────────▼─────────────────────┐ │
│  │ Business Services              │ │
│  │  - Validación                  │ │
│  │  - Lógica de negocio           │ │
│  └──────────┬─────────────────────┘ │
│             │                        │
│  ┌──────────▼─────────────────────┐ │
│  │ JPA Repository                 │ │
│  └──────────┬─────────────────────┘ │
│             │                        │
│  ┌──────────▼─────────────────────┐ │
│  │ H2 Database (dev)              │ │
│  │ PostgreSQL (prod)              │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### División de responsabilidades

**Frontend (Electron):**
- Interfaz de usuario (React + Tailwind)
- Operaciones del sistema de archivos
- Ejecutar comandos de compilación
- Calcular checksums MD5
- Integración con Outlook
- Preferencias locales (localStorage)

**Backend (Spring Boot):**
- API REST para CRUD de versiones
- Persistencia en base de datos
- Validación de datos
- Migraciones con Flyway
- Documentación OpenAPI/Swagger

---

## 🛠️ Stack tecnológico

### Frontend
- **React 18** → UI components
- **TypeScript 5** → Type safety
- **Electron 38** → Desktop wrapper
- **Tailwind CSS 3** → Styling
- **Framer Motion 10** → Animations
- **React Router 6** → Routing
- **Vite 4** → Build tool

### Backend
- **Spring Boot 3.2** → Framework
- **Java 17** → Language
- **H2 Database** → Development DB
- **PostgreSQL 15** → Production DB
- **Flyway** → Database migrations
- **Maven** → Build tool
- **Lombok** → Boilerplate reduction

### DevOps
- **Docker** → Containerization
- **Docker Compose** → Multi-container
- **Git** → Version control

---

## 📂 Estructura del proyecto

```
versiones-app/
├── frontend/                      # Aplicación Electron
│   ├── electron/                  # Main process
│   │   ├── main.cjs              # Entry point
│   │   └── preload.cjs           # Bridge IPC
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── layout/          # MainLayout, BentoNavbar
│   │   │   ├── ui/              # Card, Button, Badge
│   │   │   └── versiones/       # CrearVersionModal
│   │   ├── pages/               # Dashboard, Versions, Analytics
│   │   ├── services/            # API client (axios)
│   │   ├── types/               # TypeScript definitions
│   │   └── styles/              # Global CSS
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   └── versions-backend/         # Spring Boot API
│       ├── src/main/java/
│       │   └── com/lis/versions/
│       │       ├── versiones/   # Domain module
│       │       │   ├── api/     # REST controllers
│       │       │   ├── app/     # Services
│       │       │   ├── domain/  # Entities
│       │       │   └── infra/   # Repositories
│       │       └── common/      # Shared utilities
│       ├── src/main/resources/
│       │   ├── application.yml
│       │   └── db/migration/    # Flyway scripts
│       └── pom.xml
│
├── infra/
│   └── docker-compose.yml        # PostgreSQL + pgAdmin
│
├── docs/                         # Documentación técnica
└── README.md
```

---

## 🌐 API REST

El backend expone una API REST en `http://localhost:8080`

### Endpoints principales

```http
GET    /api/versiones              # Listar todas las versiones
GET    /api/versiones/{id}         # Obtener una versión por ID
POST   /api/versiones              # Crear nueva versión
PUT    /api/versiones/{id}         # Actualizar versión existente
DELETE /api/versiones/{id}         # Eliminar versión
POST   /api/versiones/{id}/firmar  # Cambiar estado a "Certificado"
```

### Documentación interactiva

**Swagger UI:** http://localhost:8080/swagger-ui.html

Prueba todos los endpoints desde el navegador.

---

## 🤝 Contribuir

```bash
# Fork del repo
git clone https://github.com/TU_USUARIO/versiones-app.git

# Crear rama
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commit
git add .
git commit -m "feat: agregar nueva funcionalidad"

# Push y Pull Request
git push origin feature/nueva-funcionalidad
```

### Convenciones de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formato (sin cambios de código)
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Tareas de mantenimiento

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE)

---

## 👤 Autor

**@Sandovaliseth**

---

<div align="center">

**¿Te gusta el proyecto? Dale una ⭐ en GitHub**

</div>

- **GitHub**: [@Sandovaliseth](https://github.com/Sandovaliseth)
- **Proyecto**: [versiones-app](https://github.com/Sandovaliseth/versiones-app)

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐**

Made with ❤️ by the Versiones App Team

</div>
