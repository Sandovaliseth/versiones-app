import { VALIDATION_RULES } from '@/config/constants';

export class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validators = {
  required: (value: any, fieldName: string) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new ValidationError(`${fieldName} es requerido`, fieldName);
    }
    return true;
  },

  version: (value: string, fieldName: string) => {
    if (!VALIDATION_RULES.version.pattern.test(value)) {
      throw new ValidationError(VALIDATION_RULES.version.message, fieldName);
    }
    return true;
  },

  build: (value: string, fieldName: string) => {
    if (!VALIDATION_RULES.build.pattern.test(value)) {
      throw new ValidationError(VALIDATION_RULES.build.message, fieldName);
    }
    return true;
  },

  checksum: (value: string, fieldName: string) => {
    if (!VALIDATION_RULES.checksum.pattern.test(value)) {
      throw new ValidationError(VALIDATION_RULES.checksum.message, fieldName);
    }
    return true;
  },

  email: (value: string, fieldName: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      throw new ValidationError('Email inválido', fieldName);
    }
    return true;
  },

  minLength: (value: string, min: number, fieldName: string) => {
    if (value.length < min) {
      throw new ValidationError(
        `${fieldName} debe tener al menos ${min} caracteres`,
        fieldName
      );
    }
    return true;
  },

  maxLength: (value: string, max: number, fieldName: string) => {
    if (value.length > max) {
      throw new ValidationError(
        `${fieldName} no puede exceder ${max} caracteres`,
        fieldName
      );
    }
    return true;
  },

  url: (value: string, fieldName: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      throw new ValidationError('URL inválida', fieldName);
    }
  },

  number: (value: any, fieldName: string) => {
    if (isNaN(Number(value))) {
      throw new ValidationError(`${fieldName} debe ser un número`, fieldName);
    }
    return true;
  },

  positiveNumber: (value: number, fieldName: string) => {
    if (value <= 0) {
      throw new ValidationError(`${fieldName} debe ser mayor a 0`, fieldName);
    }
    return true;
  },

  fileSize: (file: File, maxSizeMB: number, fieldName: string) => {
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ValidationError(
        `El archivo no puede exceder ${maxSizeMB}MB`,
        fieldName
      );
    }
    return true;
  },

  fileType: (file: File, allowedTypes: string[], fieldName: string) => {
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError(
        `Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`,
        fieldName
      );
    }
    return true;
  },
};

export const validateField = (
  value: any,
  rules: Array<(value: any, fieldName: string) => boolean>,
  fieldName: string
): { valid: boolean; error?: string } => {
  try {
    rules.forEach((rule) => rule(value, fieldName));
    return { valid: true };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Error de validación desconocido' };
  }
};

export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, Array<(value: any, fieldName: string) => boolean>>
): { valid: boolean; errors: Record<keyof T, string> } => {
  const errors: any = {};
  let valid = true;

  Object.keys(rules).forEach((key) => {
    const fieldRules = rules[key as keyof T];
    const result = validateField(data[key], fieldRules, key);
    
    if (!result.valid) {
      errors[key] = result.error;
      valid = false;
    }
  });

  return { valid, errors };
};
