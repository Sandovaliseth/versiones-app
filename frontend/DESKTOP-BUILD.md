# 🖥️ Versiones App - Aplicación de Escritorio

## 📦 Instalador Final para Distribución

**Archivo para distribución:** `dist-installer/Gestor de Versiones-Setup.exe` (~925 MB)

### ✅ Características
- ✅ Instalador Windows completo con desinstalador
- ✅ Funciona sin conexión a internet
- ✅ No requiere instalación de dependencias
- ✅ Actualizaciones automáticas (Squirrel)
- ✅ Icono en escritorio y menú inicio

---

## 🚀 Modos de Ejecución

### 1️⃣ Modo Web (Desarrollo)
```bash
cd frontend
npm run dev
```
Abre en navegador: http://localhost:5173

### 2️⃣ Modo Escritorio (Desarrollo con Hot Reload)
```bash
cd frontend
npm run electron:dev
```
Abre ventana de Electron con DevTools

### 3️⃣ Ejecutable Empaquetado (Sin Instalación)
Ubicación: `frontend/dist-electron/Gestor de Versiones-win32-x64/Gestor de Versiones.exe`

Doble clic para ejecutar directamente

### 4️⃣ Instalador de Windows (Producción)
Ubicación: `frontend/dist-installer/Gestor de Versiones-Setup.exe`

Instala la aplicación en el sistema como cualquier programa de Windows

---

## 🔨 Regenerar Ejecutable e Instalador

### Opción A: Todo en un comando
```bash
cd frontend
npm run build:desktop
```

### Opción B: Paso a paso
```bash
cd frontend

# 1. Compilar la web app
npm run build

# 2. Empaquetar con Electron
npm run pack:win

# 3. Generar instalador
npm run make:installer
```

---

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor web de desarrollo |
| `npm run build` | Compilar web app para producción |
| `npm run electron:dev` | App de escritorio con hot reload |
| `npm run pack:win` | Empaquetar ejecutable Windows |
| `npm run make:installer` | Generar instalador Setup.exe |
| `npm run build:desktop` | Proceso completo (build + pack + installer) |

---

## 🛠️ Cambios Técnicos Implementados

### 1. **Compatibilidad CommonJS**
- Renombrado `electron/main.js` → `electron/main.cjs`
- Renombrado `electron/preload.js` → `electron/preload.cjs`
- Actualizado `package.json` main field

### 2. **Router Compatible con Electron**
- Cambiado `BrowserRouter` → `HashRouter`
- Ahora usa URLs con `#` (ej: `#/versions`)
- Funciona con protocolo `file://`

### 3. **Correcciones de Renderer**
- `sandbox: false` en Windows (evita crashes)
- Timeout fallback para mostrar ventana
- DevTools habilitado para debug

### 4. **Empaquetado**
- `electron-packager` para crear .exe
- `electron-winstaller` para crear instalador Squirrel
- ASAR deshabilitado para facilitar debug

---

## 📁 Estructura de Archivos Generados

```
frontend/
├── dist/                          # Web app compilada
├── dist-electron/
│   └── Gestor de Versiones-win32-x64/
│       ├── Gestor de Versiones.exe   # Ejecutable principal
│       └── resources/
│           └── app/               # Código de la aplicación
└── dist-installer/
    ├── Gestor de Versiones-Setup.exe  # 👈 INSTALADOR FINAL
    ├── RELEASES                       # Metadata de versiones
    └── versiones-frontend-1.0.0-full.nupkg  # Paquete completo
```

---

## 🎯 Para Release/Distribución

**Archivo a distribuir:** `dist-installer/Gestor de Versiones-Setup.exe`

### Usuarios finales:
1. Descargan `Gestor de Versiones-Setup.exe`
2. Ejecutan el instalador
3. La app se instala en `C:\Users\[Usuario]\AppData\Local\versiones-frontend\`
4. Acceso directo creado en escritorio y menú inicio

### Actualización:
El instalador Squirrel soporta actualizaciones automáticas. Solo necesitas:
- Incrementar versión en `package.json`
- Regenerar instalador
- Publicar nuevo .exe

---

## 🐛 Troubleshooting

### Ventana no se muestra
- Verificar que no haya múltiples instancias corriendo
- Cerrar procesos: `Get-Process -Name 'Gestor de Versiones' | Stop-Process -Force`
- Revisar DevTools (F12) para errores en consola

### Error de módulos
- Eliminar `node_modules` y `package-lock.json`
- `npm install` nuevamente
- Verificar versión de Node.js (requiere 16+)

### Instalador no funciona
- Ejecutar como administrador
- Desinstalar versión anterior primero
- Verificar espacio en disco (~1GB libre)

---

## 📝 Notas

- La aplicación web y escritorio comparten el **mismo código fuente**
- Los datos se guardan en `localStorage` (por ahora)
- Para integración con backend, ajustar URLs en `src/services/`
- El instalador incluye todo: Electron + Chromium + Node.js

---

**Última actualización:** Noviembre 6, 2025
**Versión:** 1.0.0
