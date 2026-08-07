const menuToggle = document.querySelector('#nav-toggle');
const mobileNavigation = document.querySelector('#mobile-navigation');

if (menuToggle && mobileNavigation) {
  const setMenuState = (open) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  const isMenuOpen = () => menuToggle.getAttribute('aria-expanded') === 'true';

  menuToggle.addEventListener('click', () => setMenuState(!isMenuOpen()));

  mobileNavigation.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) {
      setMenuState(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
      setMenuState(false);
      menuToggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 768px)').matches && isMenuOpen()) {
      setMenuState(false);
    }
  });
}
