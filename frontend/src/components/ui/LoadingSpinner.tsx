import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'gradient';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'gradient',
  text,
  className 
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      {/* Spinner principal con animación */}
      <div className="relative">
        {/* Anillo exterior giratorio */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
          className={cn(
            sizeClasses[size],
            'rounded-full',
            variant === 'gradient' && 'border-4 border-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-border',
            variant === 'primary' && 'border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-pink-400',
            variant === 'secondary' && 'border-4 border-gray-200 dark:border-gray-700 border-t-gray-600 dark:border-t-gray-400'
          )}
          style={variant === 'gradient' ? {
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            padding: '4px'
          } : undefined}
        />

        {/* Anillo interior con pulso */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className={cn(
            'absolute inset-0 rounded-full',
            variant === 'gradient' && 'bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-500/20',
            variant === 'primary' && 'bg-purple-400/20',
            variant === 'secondary' && 'bg-gray-400/20'
          )}
        />

        {/* Punto central animado */}
        <motion.div
          animate={{ 
            scale: [0.8, 1, 0.8],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className={cn(
            'absolute inset-0 m-auto rounded-full',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-3 h-3',
            size === 'lg' && 'w-4 h-4',
            size === 'xl' && 'w-6 h-6',
            variant === 'gradient' && 'bg-gradient-to-br from-purple-500 to-pink-500',
            variant === 'primary' && 'bg-purple-600 dark:bg-pink-400',
            variant === 'secondary' && 'bg-gray-600 dark:bg-gray-400'
          )}
        />

        {/* Partículas orbitales */}
        {['gradient', 'primary'].includes(variant) && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
              className="absolute inset-0"
            >
              <div className={cn(
                'absolute rounded-full',
                size === 'sm' && 'w-1 h-1 -top-0.5 left-1/2',
                size === 'md' && 'w-1.5 h-1.5 -top-1 left-1/2',
                size === 'lg' && 'w-2 h-2 -top-1 left-1/2',
                size === 'xl' && 'w-3 h-3 -top-1.5 left-1/2',
                'bg-purple-500 shadow-lg shadow-purple-500/50'
              )} />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
              className="absolute inset-0"
            >
              <div className={cn(
                'absolute rounded-full',
                size === 'sm' && 'w-1 h-1 -bottom-0.5 left-1/2',
                size === 'md' && 'w-1.5 h-1.5 -bottom-1 left-1/2',
                size === 'lg' && 'w-2 h-2 -bottom-1 left-1/2',
                size === 'xl' && 'w-3 h-3 -bottom-1.5 left-1/2',
                'bg-pink-500 shadow-lg shadow-pink-500/50'
              )} />
            </motion.div>
          </>
        )}
      </div>

      {/* Texto de carga con animación */}
      {text && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className={cn(
            'font-sans font-medium',
            textSizeClasses[size],
            variant === 'gradient' && 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent',
            variant === 'primary' && 'text-purple-600 dark:text-pink-400',
            variant === 'secondary' && 'text-gray-600 dark:text-gray-400'
          )}
        >
          {text}
        </motion.p>
      )}

      {/* Puntos de carga animados */}
      {text && (
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1, 
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
              className={cn(
                'rounded-full',
                size === 'sm' && 'w-1 h-1',
                size === 'md' && 'w-1.5 h-1.5',
                size === 'lg' && 'w-2 h-2',
                size === 'xl' && 'w-2.5 h-2.5',
                variant === 'gradient' && 'bg-gradient-to-r from-purple-500 to-pink-500',
                variant === 'primary' && 'bg-purple-500',
                variant === 'secondary' && 'bg-gray-500'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

