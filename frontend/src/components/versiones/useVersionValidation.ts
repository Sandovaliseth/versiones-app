import { useState } from 'react';
import { CrearVersionData, camposRequeridos } from './types';

type ValidationErrors = Partial<Record<keyof CrearVersionData, string>>;

export const useVersionValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = (field: keyof CrearVersionData, value: any): string | undefined => {
    // Versión Base
    if (field === 'versionBase' && value) {
      if (!/^\d+\.\d+\.\d+$/.test(value.trim())) {
        return 'Formato debe ser X.Y.Z (ej: 1.0.0)';
      }
    }

    // Versión Aumento
    if (field === 'versionAumento' && value) {
      if (!/^\d+\.\d+\.\d+$/.test(value.trim())) {
        return 'Formato debe ser X.Y.Z (ej: 1.0.0)';
      }
    }

    // Build
    if (field === 'build' && value) {
      if (!/^\d{6}$/.test(value.trim())) {
        return 'Formato debe ser AAMMDD (6 dígitos)';
      }
    }

    return undefined;
  };

  const validateForm = (formData: CrearVersionData): boolean => {
    const newErrors: ValidationErrors = {};
    const requiredFields = camposRequeridos[formData.tipoDocumento];

    // Validar campos requeridos
    requiredFields.forEach((field) => {
      const value = formData[field as keyof CrearVersionData];
      if (!value || (typeof value === 'string' && !value.trim())) {
        newErrors[field as keyof CrearVersionData] = 'Este campo es requerido';
      }
    });

    // Validaciones de formato
    if (formData.versionBase) {
      const error = validateField('versionBase', formData.versionBase);
      if (error) newErrors.versionBase = error;
    }

    if (formData.versionAumento) {
      const error = validateField('versionAumento', formData.versionAumento);
      if (error) newErrors.versionAumento = error;
    }

    if (formData.build) {
      const error = validateField('build', formData.build);
      if (error) newErrors.build = error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
