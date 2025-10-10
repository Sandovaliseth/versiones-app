import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';

interface UseAdaptiveThemeReturn {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Hook personalizado para gestionar el modo oscuro adaptativo inteligente.
 * 
 * Características:
 * - Modo oscuro por defecto (18:00-06:00)
 * - Detección automática de hora del día
 * - Persistencia en localStorage
 * - Transiciones suaves entre modos
 * - Respeta preferencias del sistema
 * 
 * @returns {UseAdaptiveThemeReturn} Estado y funciones del tema
 */
export function useAdaptiveTheme(): UseAdaptiveThemeReturn {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Cargar tema guardado o usar 'auto' por defecto
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'dark'; // Dark mode por defecto según requisitos UX 2025
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');

  
  const shouldUseDarkMode = (): boolean => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
  };

  
  const resolveTheme = (currentTheme: Theme): ResolvedTheme => {
    if (currentTheme === 'auto') {
      // Modo auto: usar hora del día
      return shouldUseDarkMode() ? 'dark' : 'light';
    }
    return currentTheme;
  };

  
  const applyTheme = (newResolvedTheme: ResolvedTheme) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remover clases previas
    root.removeAttribute('data-theme');
    body.classList.remove('theme-transitioning');
    
    // Aplicar nueva clase con transición
    body.classList.add('theme-transitioning');
    
    setTimeout(() => {
      if (newResolvedTheme === 'dark') {
        root.setAttribute('data-theme', 'dark');
        body.classList.add('dark-mode');
        body.classList.remove('light-mode');
      } else {
        root.setAttribute('data-theme', 'light');
        body.classList.add('light-mode');
        body.classList.remove('dark-mode');
      }
      
      // Remover clase de transición después de aplicar
      setTimeout(() => {
        body.classList.remove('theme-transitioning');
      }, 600);
    }, 10);
    
    setResolvedTheme(newResolvedTheme);
  };

  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    const resolved = resolveTheme(newTheme);
    applyTheme(resolved);
    
    console.log(`🎨 Tema cambiado: ${newTheme} (resuelto: ${resolved})`);
  };

  
  const toggleTheme = () => {
    if (theme === 'auto') {
      // Si está en auto, cambiar al opuesto del actual resuelto
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Alternar entre light y dark
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  
  useEffect(() => {
    const resolved = resolveTheme(theme);
    applyTheme(resolved);
    
    console.log(`🌓 Tema adaptativo inicializado: ${theme} (${resolved})`);
  }, []);

  
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const resolved = resolveTheme('auto');
      applyTheme(resolved);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  
  useEffect(() => {
    if (theme !== 'auto') return;

    const interval = setInterval(() => {
      const newResolved = resolveTheme('auto');
      if (newResolved !== resolvedTheme) {
        applyTheme(newResolved);
        console.log(`🌙☀️ Tema auto actualizado por hora: ${newResolved}`);
      }
    }, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [theme, resolvedTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme
  };
}


export function getThemeEmoji(theme: Theme, resolvedTheme: ResolvedTheme): string {
  if (theme === 'auto') {
    return resolvedTheme === 'dark' ? '🌙' : '☀️';
  }
  return theme === 'dark' ? '🌙' : '☀️';
}


export function getThemeLabel(theme: Theme): string {
  const labels: Record<Theme, string> = {
    light: 'Modo Claro',
    dark: 'Modo Oscuro',
    auto: 'Modo Adaptativo'
  };
  return labels[theme];
}
