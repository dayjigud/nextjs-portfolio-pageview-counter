const Footer = () => {
  return (
    <footer className="py-8">
      <div className="container text-center text-text-dark">
        <p className="text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
          &copy; {new Date().getFullYear()} Ayodeji Adeniyi. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
