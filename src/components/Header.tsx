import { useState } from 'react';
import { m } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { title: 'Home', href: '#home' },
  { title: 'About', href: '#about' },
  { title: 'Experience', href: '#experience' },
  { title: 'Projects', href: '#projects' },
  { title: 'Contact', href: '#contact' },
];

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  const linkVariants = {
    hover: {
      scale: 1.1,
      y: -2,
      transition: { type: 'spring', stiffness: 300 },
    },
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <m.div
          className="flex items-center justify-between h-20 bg-secondary rounded-b-2xl shadow-clay px-8"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          <m.a
            href="#home"
            className="text-2xl font-bold text-text-dark"
            variants={linkVariants}
            whileHover="hover"
          >
            Ayodeji
          </m.a>
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <m.a
                key={link.title}
                href={link.href}
                className="text-text-dark font-semibold hover:text-primary transition-colors"
                variants={linkVariants}
                whileHover="hover"
              >
                {link.title}
              </m.a>
            ))}
          </nav>
          <div className="md:hidden">
            <m.button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-dark"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isOpen ? <X /> : <Menu />}
            </m.button>
          </div>
        </m.div>
      </div>
      {isOpen && (
        <m.div
          className="md:hidden bg-secondary shadow-clay rounded-b-2xl mt-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <nav className="flex flex-col items-center space-y-4 py-4">
            {navLinks.map((link) => (
              <m.a
                key={link.title}
                href={link.href}
                className="text-text-dark font-semibold hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
                variants={linkVariants}
                whileHover="hover"
              >
                {link.title}
              </m.a>
            ))}
          </nav>
        </m.div>
      )}
    </header>
  );
};

export default Header;
