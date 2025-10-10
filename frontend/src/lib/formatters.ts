export const formatters = {
  date: (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(dateObj);
  },

  dateTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  },

  relativeTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    if (days < 7) return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `Hace ${months} mes${months !== 1 ? 'es' : ''}`;
    }
    const years = Math.floor(days / 365);
    return `Hace ${years} año${years !== 1 ? 's' : ''}`;
  },

  fileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  },

  number: (num: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },

  currency: (amount: number, currency: string = 'COP'): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  percentage: (value: number, decimals: number = 1): string => {
    return `${formatters.number(value, decimals)}%`;
  },

  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  capitalize: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  camelToTitle: (text: string): string => {
    const result = text.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  },

  slugify: (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  checksum: (text: string): string => {
    if (text.length <= 16) return text;
    return `${text.substring(0, 8)}...${text.substring(text.length - 8)}`;
  },

  version: (version: string): string => {
    const parts = version.split('.');
    if (parts.length !== 3) return version;
    return `v${parts[0]}.${parts[1]}.${parts[2]}`;
  },

  buildDate: (build: string): string => {
    if (build.length !== 6) return build;
    
    const year = `20${build.substring(0, 2)}`;
    const month = build.substring(2, 4);
    const day = build.substring(4, 6);
    
    return `${day}/${month}/${year}`;
  },

  phoneNumber: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }
    return phone;
  },

  idDocument: (id: string): string => {
    const cleaned = id.replace(/\D/g, '');
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  },
};

export const parsers = {
  date: (dateString: string): Date | null => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  },

  number: (value: string): number | null => {
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? null : num;
  },

  boolean: (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'si'].includes(value.toLowerCase());
    }
    return Boolean(value);
  },

  json: <T = any>(jsonString: string, fallback: T | null = null): T | null => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return fallback;
    }
  },
};
