import { Github, Linkedin, Mail } from 'lucide-react';

const Contact = () => {
  return (
    <section className="section" id="contact">
      <div className="container text-center">
        <div
          className="bg-primary rounded-2xl shadow-clay p-8 md:p-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get in Touch
          </h2>
          <p className="max-w-xl mx-auto mb-8">
            I'm always open to discussing new projects, creative ideas, or opportunities to be part of an ambitious vision.
          </p>
          <div
            className="flex justify-center gap-6"
          >
            <a
              href="mailto:dayjigud@gmail.com"
              className="p-4 bg-secondary rounded-full shadow-clay text-text-dark"
            >
              <Mail size={32} />
            </a>
            <a
              href="https://github.com/dayjigud"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-secondary rounded-full shadow-clay text-text-dark"
            >
              <Github size={32} />
            </a>
            <a
              href="https://linkedin.com/in/dayjigud"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-secondary rounded-full shadow-clay text-text-dark"
            >
              <Linkedin size={32} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;