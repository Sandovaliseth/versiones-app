import { useState } from 'react';
import { CrearVersionData, camposRequeridos } from './types';

type ValidationErrors = Partial<Record<keyof CrearVersionData, string>>;

export type ValidationResult = {
  isValid: boolean;
  missingFields: (keyof CrearVersionData)[];
  formatErrors: (keyof CrearVersionData)[];
};

export const useVersionValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (field: keyof CrearVersionData, value: any): string | undefined => {
    if (field === 'versionBase' && value) {
      if (!/^\d+\.\d+\.\d+$/.test(value.trim())) {
        return 'Formato debe ser X.Y.Z (ej: 1.0.0)';
      }
    }

    if (field === 'versionAumento' && value) {
      if (!/^\d+\.\d+\.\d+$/.test(value.trim())) {
        return 'Formato debe ser X.Y.Z (ej: 1.0.0)';
      }
    }

    if (field === 'build' && value) {
      if (!/^\d{6}$/.test(value.trim())) {
        return 'Formato debe ser AAMMDD (6 dígitos)';
      }
    }

    return undefined;
  };

  const validateForm = (formData: CrearVersionData): ValidationResult => {
    const newErrors: ValidationErrors = {};
    const missingFields: (keyof CrearVersionData)[] = [];
    const formatErrors: (keyof CrearVersionData)[] = [];
    const isDemo = Boolean(formData.esDemo);
    const requiredFields = camposRequeridos[formData.tipoDocumento];

    requiredFields.forEach((field) => {
      if (field === 'versionAumento' && formData.incluirVersionAumento === false) {
        return;
      }
      if (isDemo && (field === 'versionBase' || field === 'versionAumento')) {
        return;
      }
      const key = field as keyof CrearVersionData;
      const value = formData[key];
      if (!value || (typeof value === 'string' && !value.trim())) {
        newErrors[key] = 'Este campo es requerido';
        missingFields.push(key);
      }
    });

    (['versionBase', 'versionAumento', 'build'] as const).forEach((fieldKey) => {
      if (isDemo && (fieldKey === 'versionBase' || fieldKey === 'versionAumento')) return;
      const value = formData[fieldKey];
      if (!value) return;
      const error = validateField(fieldKey, value);
      if (error) {
        newErrors[fieldKey] = error;
        formatErrors.push(fieldKey);
      }
    });

    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      missingFields,
      formatErrors
    };
  };

  const clearErrors = () => setErrors({});

  return {
    errors,
    validateForm,
    validateField,
    setErrors,
    clearErrors
  };
};
