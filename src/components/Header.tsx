import { useState } from 'react';
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="flex items-center justify-between h-20 bg-secondary rounded-b-2xl shadow-clay px-8"
        >
          <a
            href="#home"
            className="text-2xl font-bold text-text-dark"
          >
            Ayodeji
          </a>
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                className="text-text-dark font-semibold hover:text-primary transition-colors"
              >
                {link.title}
              </a>
            ))}
          </nav>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-text-dark"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && (
        <div
          className="md:hidden bg-secondary shadow-clay rounded-b-2xl mt-2"
        >
          <nav className="flex flex-col items-center space-y-4 py-4">
            {navLinks.map((link) => (
              <a
                key={link.title}
                href={link.href}
                className="text-text-dark font-semibold hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.title}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
