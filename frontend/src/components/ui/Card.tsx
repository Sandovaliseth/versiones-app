import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CardProps } from '@/types';

const Card = ({ 
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  shadow = 'md',
  border = true,
  className,
  children,
  ...props 
}: CardProps) => {
  const baseClasses = 'bg-white dark:bg-gray-800 transition-all duration-200';
  
  const variants = {
    default: 'border-gray-200 dark:border-gray-700',
    glass: 'backdrop-blur-md bg-white/70 dark:bg-gray-800/70 border-white/20 dark:border-gray-700/20',
    elevated: 'border-gray-200 dark:border-gray-700 hover:shadow-lg'
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const roundings = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  return (
    <motion.div
      className={cn(
        baseClasses,
        variants[variant],
        paddings[padding],
        roundings[rounded],
        shadows[shadow],
        border && 'border',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Subcomponentes del Card
const CardHeader = ({ className, children, ...props }: CardProps) => (
  <div className={cn('pb-4 border-b border-gray-200 dark:border-gray-700', className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }: CardProps) => (
  <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ className, children, ...props }: CardProps) => (
  <p className={cn('text-sm text-gray-500 dark:text-gray-400 mt-1', className)} {...props}>
    {children}
  </p>
);

const CardContent = ({ className, children, ...props }: CardProps) => (
  <div className={cn('pt-4', className)} {...props}>
    {children}
  </div>
);

const CardFooter = ({ className, children, ...props }: CardProps) => (
  <div className={cn('pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end space-x-2', className)} {...props}>
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
