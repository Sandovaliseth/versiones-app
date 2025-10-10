import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export function useCursorPosition() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 25, stiffness: 300 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return { cursorX: cursorXSpring, cursorY: cursorYSpring };
}

export function CursorTrail() {
  const { cursorX, cursorY } = useCursorPosition();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <><motion.div
        className="cursor-glow-trail pointer-events-none"
        style={{
          left: cursorX,
          top: cursorY,
          x: '-50%',
          y: '-50%',
        }}
      /><motion.div
        className="cursor-glow-trail pointer-events-none"
        style={{
          left: cursorX,
          top: cursorY,
          x: '-50%',
          y: '-50%',
          width: '40px',
          height: '40px',
          border: '2px solid rgba(233, 30, 99, 0.3)',
          background: 'transparent',
          filter: 'blur(0px)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </>
  );
}


interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}

export function MagneticButton({ 
  children, 
  className = '', 
  onClick,
  strength = 0.3 
}: MagneticButtonProps) {
  const [buttonRef, setButtonRef] = useState<HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  useEffect(() => {
    if (!buttonRef) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = buttonRef.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
      
      // Solo aplicar efecto si el cursor está cerca (dentro de 150px)
      if (distance < 150) {
        x.set(distanceX * strength);
        y.set(distanceY * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    buttonRef.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      buttonRef?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [buttonRef, x, y, strength]);

  return (
    <motion.button
      ref={setButtonRef}
      className={`cursor-magnetic ${className}`}
      style={{ x: xSpring, y: ySpring }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}


interface HoverRevealProps {
  preview: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export function HoverReveal({ preview, content, className = '' }: HoverRevealProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`hover-reveal relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
    ><div className={`transition-opacity duration-300 ${isHovered ? 'opacity-30' : 'opacity-100'}`}>
        {preview}
      </div><motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 20,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="absolute inset-0 flex items-center justify-center p-6 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 rounded-2xl"
      >
        {content}
      </motion.div>
    </motion.div>
  );
}


interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
    >{isHovered && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(233, 30, 99, 0.2) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}<div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}


interface InteractiveIconProps {
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function InteractiveIcon({ icon, className = '', onClick }: InteractiveIconProps) {
  return (
    <motion.div
      className={`interactive-icon ${className}`}
      whileHover={{ 
        scale: 1.2, 
        rotate: 10,
        transition: { type: 'spring', stiffness: 300 }
      }}
      whileTap={{ scale: 0.9, rotate: -10 }}
      onClick={onClick}
    >
      {icon}
    </motion.div>
  );
}
