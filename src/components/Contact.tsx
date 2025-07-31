import { Github, Linkedin, Mail } from 'lucide-react';
import GlassmorphicCard from './GlassmorphicCard';

const sectionAnimation = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const Contact = () => {
  return (
    <section className="section" id="contact">
      <div className="container text-center">
        <GlassmorphicCard
          variants={sectionAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Get in Touch
          </h2>
          <p
            className="max-w-xl mx-auto mb-8"
          >
            I'm always open to discussing new projects, creative ideas, or opportunities to be part of an ambitious vision.
          </p>
          <div
            className="flex justify-center gap-6"
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
          </div>
        </GlassmorphicCard>
      </div>
    </section>
  );
};

export default Contact;