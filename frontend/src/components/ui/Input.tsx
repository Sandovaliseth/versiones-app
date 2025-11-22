import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { InputProps } from '@/types';

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    variant = 'default',
    inputSize = 'md',
    error,
    label,
    helperText,
    required = false,
    className,
    ...props 
  }, ref) => {
    const baseClasses = 'input-modern w-full rounded-2xl disabled:opacity-70 disabled:cursor-not-allowed';

    const variants = {
      default: '',
      error: 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-500 dark:focus:ring-red-800/40'
    } as const;

    const sizes = {
      sm: 'py-2 px-3 text-sm',
      md: 'py-3 px-4 text-base',
      lg: 'py-3.5 px-5 text-lg'
    } as const;

    const inputVariant: keyof typeof variants = error ? 'error' : variant;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        
        <input
          ref={ref}
          className={cn(
            baseClasses,
            sizes[inputSize],
            variants[inputVariant],
            className
          )}
          {...props}
        />
        
        {(helperText || error) && (
          <p className={cn(
            'mt-2 text-sm transition-all duration-200',
            error ? 'text-danger-600 dark:text-danger-400' : 'text-gray-500 dark:text-gray-400'
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;