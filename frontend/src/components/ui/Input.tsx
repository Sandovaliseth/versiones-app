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
    const baseClasses = 'w-full rounded-lg border transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed !text-black dark:!text-white placeholder:!text-gray-400 placeholder:!opacity-100 dark:placeholder:!text-gray-500 font-display font-semibold';
    
    const variants = {
      default: 'border-gray-300 bg-white focus:border-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:focus:border-primary-400',
      error: 'border-danger-300 bg-white focus:border-danger-500 dark:border-danger-600 dark:bg-gray-800 dark:focus:border-danger-400'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base'
    };

    const inputVariant = error ? 'error' : variant;

    return (
      <div className="w-full group">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-all duration-200 group-focus-within:text-pink-600 dark:group-focus-within:text-pink-400">
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative" style={{ perspective: "1000px" }}>
          <input
            ref={ref}
            className={cn(
              baseClasses,
              variants[inputVariant],
              sizes[inputSize],
              'transform-gpu transition-all duration-300',
              'hover:scale-[1.01] hover:shadow-lg hover:-translate-y-0.5',
              'focus:scale-[1.02] focus:shadow-xl focus:-translate-y-1',
              'hover:border-pink-400 dark:hover:border-pink-500',
              className
            )}
            style={{
              transformStyle: "preserve-3d"
            }}
            {...props}
          />
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-pink-500/0 via-purple-500/0 to-pink-500/0 group-focus-within:from-pink-500/10 group-focus-within:via-purple-500/10 group-focus-within:to-pink-500/10 transition-all duration-500 pointer-events-none -z-10 blur-xl"></div>
        </div>
        
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