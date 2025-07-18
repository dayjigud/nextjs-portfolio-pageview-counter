import { motion } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';

const Contact = () => {
  return (
    <section className="section bg-secondary" id="contact">
      <div className="container text-center">
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Get in Touch
        </motion.h2>
        <motion.p
          className="max-w-xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          I'm always open to discussing new projects, creative ideas, or opportunities to be part of an ambitious vision.
        </motion.p>
        <motion.div
          className="flex justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <a href="mailto:dayjigud@gmail.com" className="text-accent hover:text-white transition-colors">
            <Mail size={32} />
          </a>
          <a href="https://github.com/dayjigud" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-white transition-colors">
            <Github size={32} />
          </a>
          <a href="https://linkedin.com/in/dayjigud" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-white transition-colors">
            <Linkedin size={32} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;