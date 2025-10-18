import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import Input from '../ui/Input';
import { cn } from '../../lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
  borderColor = 'border-pink-200 dark:border-pink-800'
}) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ 
      scale: 1.005,
      transition: { duration: 0.2 }
    }}
    transition={{ 
      duration: 0.3,
      type: "spring",
      stiffness: 260,
      damping: 22
    }}
    className={cn(
      'space-y-4 p-6 border-2 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50',
      borderColor,
      className
    )}
    style={{
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    }}
  >
    <div>
      <h3 className="font-sans text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-800 dark:text-gray-300 mt-2 font-body font-semibold leading-relaxed">
          {description}
        </p>
      )}
    </div>
    <div>
      {children}
    </div>
  </motion.div>
);

interface FieldGroupProps {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  helper?: string;
}

export const FieldGroup: React.FC<FieldGroupProps> = ({
  label,
  required,
  icon,
  children,
  helper
}) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 font-body text-sm font-bold text-gray-900 dark:text-gray-100">
      {icon}
      {label}
      {required && <span className="text-red-600 dark:text-red-400">*</span>}
    </label>
    {children}
    {helper && (
      <p className="text-xs text-gray-700 dark:text-gray-300 font-body font-semibold">
        {helper}
      </p>
    )}
  </div>
);

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  inputRef?: (el: HTMLInputElement | null) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  helper?: string;
  type?: 'text' | 'number';
  disabled?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  onEnter,
  inputRef,
  error,
  required,
  placeholder,
  icon,
  helper,
  type = 'text',
  disabled = false
}) => (
  <FieldGroup label={label} required={required} icon={icon} helper={helper}>
    <Input
      ref={inputRef as any}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      error={error}
      disabled={disabled}
      className="input-modern w-full rounded-2xl"
    />
  </FieldGroup>
);

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  helper?: string;
}

export const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  rows = 3,
  helper
}) => (
  <FieldGroup label={label} required={required} helper={helper}>
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={cn(
        'input-modern w-full resize-none font-sans font-semibold rounded-2xl !text-gray-900 dark:!text-white placeholder:!text-gray-600 placeholder:!opacity-100 dark:placeholder:!text-gray-400',
        error && 'border-red-500 dark:border-red-500'
      )}
    />
    {error && (
      <p className="text-xs text-red-500 mt-1 font-body">{error}</p>
    )}
  </FieldGroup>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  helper?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  required,
  helper
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <FieldGroup label={label} required={required} helper={helper}>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          className="input-modern w-full rounded-2xl font-sans font-semibold !text-gray-900 dark:!text-white appearance-none pr-14 cursor-pointer 
                     border-2 border-gray-400 dark:border-gray-600
                     hover:border-pink-400 dark:hover:border-pink-500
                     focus:border-pink-500 dark:focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 dark:focus:ring-pink-800/50
                     transition-all duration-200
                     bg-white dark:bg-gray-800
                     hover:shadow-md focus:shadow-lg"
        >
          {options.map((opt) => (
            <option 
              key={opt.value} 
              value={opt.value} 
              className="font-body py-3 px-4 bg-white dark:bg-gray-800 !text-gray-900 dark:!text-gray-100 font-semibold"
            >
              {opt.label}
            </option>
          ))}
        </select>
        
        {/* Animated Chevron with Framer Motion */}
        <motion.div 
          className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          animate={{ 
            rotate: isOpen ? 180 : 0,
            y: isOpen ? '-45%' : '-50%',
            scale: isOpen ? 1.15 : 1
          }}
          transition={{ 
            duration: 0.3, 
            ease: [0.4, 0, 0.2, 1]
          }}
        >
          <div className="relative">
            {/* Glow effect on hover/focus */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-lg"
              animate={{ 
                opacity: isOpen ? 0.5 : 0,
                scale: isOpen ? 1.3 : 1
              }}
              transition={{ duration: 0.3 }}
            ></motion.div>
            
            {/* Chevron Icon */}
            <motion.svg 
              className="h-6 w-6 text-pink-600 dark:text-pink-400 relative" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2.5}
              animate={{
                color: isOpen 
                  ? 'rgb(236, 72, 153)' // pink-500
                  : 'rgb(219, 39, 119)'  // pink-600
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </motion.svg>
          </div>
        </motion.div>

        {/* Hover gradient border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-20 dark:group-hover:opacity-10 transition-opacity duration-300 -z-10 blur-xl"></div>
      </div>
    </FieldGroup>
  );
};

interface FileFieldProps {
  label: string;
  onChange: (file: File | undefined) => void;
  accept?: string;
  required?: boolean;
  helper?: string;
}

export const FileField: React.FC<FileFieldProps> = ({
  label,
  onChange,
  accept,
  required,
  helper
}) => (
  <FieldGroup label={label} required={required} helper={helper}>
    <motion.label
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="cursor-pointer block"
    >
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-center hover:border-pink-500 dark:hover:border-pink-500 transition-all duration-300 bg-gray-50/50 dark:bg-gray-800/50">
        <svg className="h-8 w-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Click para seleccionar archivo
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {accept || 'Todos los archivos'}
        </p>
      </div>
      <input
        type="file"
        onChange={(e) => onChange(e.target.files?.[0])}
        className="hidden"
        accept={accept}
      />
    </motion.label>
  </FieldGroup>
);


interface PathFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  helper?: string;
}

export const PathField: React.FC<PathFieldProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  helper
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowse = () => {
    // Abrir el selector de carpetas nativo
    fileInputRef.current?.click();
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Obtener la ruta de la primera archivo (la carpeta)
      const file = files[0];
      // @ts-ignore - webkitRelativePath existe en navegadores modernos
      const fullPath = file.webkitRelativePath || file.name;
      // Extraer solo el path de la carpeta (sin el nombre del archivo)
      const folderPath = fullPath.split('/')[0] || fullPath;
      
      // En Windows, intentar construir una ruta más realista
      const fakePath = `C:\\Users\\Documentos\\${folderPath}`;
      onChange(fakePath);
    }
  };

  return (
    <FieldGroup label={label} required={required} helper={helper}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            className="input-modern w-full rounded-2xl"
          />
        </div><input
          ref={fileInputRef}
          type="file"
          // @ts-ignore - webkitdirectory es soportado por Chrome/Edge
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleFolderSelect}
          className="hidden"
        />
        <motion.button
          type="button"
          onClick={handleBrowse}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all flex items-center justify-center shadow-lg"
          title="Explorar carpetas"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </motion.button>
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 font-body">{error}</p>
      )}
    </FieldGroup>
  );
};

