# Script para abrir la aplicación automáticamente

Write-Host "🚀 Iniciando Versiones App..." -ForegroundColor Cyan

# Verificar si npm está disponible
if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm no está instalado. Por favor instala Node.js primero." -ForegroundColor Red
    exit 1
}

# Cambiar al directorio del frontend
$frontendPath = "c:\Users\WDS BUCARAMANGA\IdeaProjects\versiones-app\frontend"
cd $frontendPath

Write-Host "📁 Directorio: $frontendPath" -ForegroundColor Gray
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow

# Instalar dependencias si es necesario
if (-not (Test-Path "node_modules")) {
    npm install
}

Write-Host "🎨 Aplicación con diseño minimalista 2025" -ForegroundColor Magenta
Write-Host "🎯 Usando datos mock para desarrollo" -ForegroundColor Yellow
Write-Host "🌐 Abriendo en: http://localhost:3000" -ForegroundColor Green

# Esperar un momento y abrir el navegador
Start-Sleep -Seconds 2

# Abrir navegador automáticamente
Start-Process "http://localhost:3000"

# Iniciar el servidor de desarrollo
Write-Host "🔥 Iniciando servidor de desarrollo..." -ForegroundColor Cyan
npm run dev