import { motion, MotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassmorphicCardProps extends MotionProps {
  children: ReactNode;
  className?: string;
}

const GlassmorphicCard = ({ children, className = '', ...rest }: GlassmorphicCardProps) => {
  return (
    <motion.div
      className={`bg-secondary/50 backdrop-blur-lg rounded-2xl border border-white/10 shadow-xl p-8 ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export default GlassmorphicCard;
