import { motion, Variants } from 'framer-motion';
import React from 'react';

interface WavyTextRevealProps {
  text: string;
  className?: string;
}

const WavyTextReveal: React.FC<WavyTextRevealProps> = ({ text, className }) => {
  const words = text.split(' ');

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      transition: { type: 'spring', damping: 12, stiffness: 100 },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 12, stiffness: 100 },
    },
  };

  const colors = ['#1F2937']; // A dark gray color

  return (
    <motion.div
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, index) => (
        <motion.div
          key={index}
          variants={child}
          style={{
            marginRight: '8px',
            overflow: 'hidden',
            padding: '2px 6px',
            borderRadius: '6px',
            backgroundColor: colors[0],
            color: '#FFFFFF', // White text
          }}
          // Wavy animation
          animate={{
            y: [0, -5, 5, -5, 0],
            transition: {
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
              delay: index * 0.1
            }
          }}
        >
          {word}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default WavyTextReveal;
