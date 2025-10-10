# Script para convertir la aplicación a escritorio con Tauri

# Configuración para aplicación de escritorio
param(
    [string]$Action = "init"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Configurando aplicación de escritorio para Versiones App" -ForegroundColor Cyan

switch ($Action) {
    "init" {
        Write-Host "📦 Instalando Tauri CLI..." -ForegroundColor Yellow
        
        # Instalar Tauri CLI
        npm install -g @tauri-apps/cli
        
        # Crear configuración de Tauri
        Write-Host "⚙️  Inicializando Tauri..." -ForegroundColor Yellow
        npx tauri init --name "Gestor de Versiones" --window-title "Gestor de Versiones - 2025" --dist-dir "../dist" --dev-path "http://localhost:3000"
        
        Write-Host "✅ Tauri configurado correctamente" -ForegroundColor Green
    }
    
    "dev" {
        Write-Host "🔧 Iniciando aplicación de escritorio en modo desarrollo..." -ForegroundColor Yellow
        npx tauri dev
    }
    
    "build" {
        Write-Host "🏗️  Construyendo aplicación de escritorio..." -ForegroundColor Yellow
        npm run build
        npx tauri build
        Write-Host "✅ Aplicación de escritorio construida en src-tauri/target/release/" -ForegroundColor Green
    }
    
    "setup" {
        Write-Host "📋 Configurando dependencias del sistema..." -ForegroundColor Yellow
        Write-Host "Para Windows necesitas:" -ForegroundColor White
        Write-Host "- Microsoft C++ Build Tools" -ForegroundColor Gray
        Write-Host "- Windows 10/11 SDK" -ForegroundColor Gray
        Write-Host "- Rust (se instalará automáticamente)" -ForegroundColor Gray
        
        # Instalar Rust si no está disponible
        if (!(Get-Command "rustc" -ErrorAction SilentlyContinue)) {
            Write-Host "🦀 Instalando Rust..." -ForegroundColor Yellow
            Invoke-WebRequest -Uri "https://sh.rustup.rs" -OutFile "rustup-init.exe"
            ./rustup-init.exe -y
            Remove-Item "rustup-init.exe"
        }
        
        Write-Host "✅ Sistema configurado" -ForegroundColor Green
    }
    
    default {
        Write-Host "❌ Acción no reconocida. Usa: init, dev, build, setup" -ForegroundColor Red
    }
}

Write-Host "`n📖 Comandos disponibles:" -ForegroundColor Cyan
Write-Host "  ./desktop-setup.ps1 setup  - Configurar dependencias" -ForegroundColor White
Write-Host "  ./desktop-setup.ps1 init   - Inicializar Tauri" -ForegroundColor White  
Write-Host "  ./desktop-setup.ps1 dev    - Ejecutar en desarrollo" -ForegroundColor White
Write-Host "  ./desktop-setup.ps1 build  - Construir para producción" -ForegroundColor White