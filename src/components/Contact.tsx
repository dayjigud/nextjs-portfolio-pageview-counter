import { motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';

const sectionAnimation = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      type: 'spring',
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.2,
    },
  },
};

const iconAnimation = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 200, damping: 10 },
  },
};

const Contact = () => {
  return (
    <section className="section" id="contact">
      <div className="container text-center">
        <motion.div
          className="bg-primary rounded-2xl shadow-clay p-8 md:p-12"
          variants={sectionAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get in Touch
          </h2>
          <p className="max-w-xl mx-auto mb-8">
            I'm always open to discussing new projects, creative ideas, or opportunities to be part of an ambitious vision.
          </p>
          <motion.div
            className="flex justify-center gap-6"
            variants={sectionAnimation}
          >
            <motion.a
              href="mailto:dayjigud@gmail.com"
              className="p-4 bg-secondary rounded-full shadow-clay text-text-dark"
              variants={iconAnimation}
              whileHover={{ scale: 1.2, y: -5, transition: { type: 'spring', stiffness: 300 } }}
            >
              <Mail size={32} />
            </motion.a>
            <motion.a
              href="https://github.com/dayjigud"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-secondary rounded-full shadow-clay text-text-dark"
              variants={iconAnimation}
              whileHover={{ scale: 1.2, y: -5, transition: { type: 'spring', stiffness: 300 } }}
            >
              <Github size={32} />
            </motion.a>
            <motion.a
              href="https://linkedin.com/in/dayjigud"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-secondary rounded-full shadow-clay text-text-dark"
              variants={iconAnimation}
              whileHover={{ scale: 1.2, y: -5, transition: { type: 'spring', stiffness: 300 } }}
            >
              <Linkedin size={32} />
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;