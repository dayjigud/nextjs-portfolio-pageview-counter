import React, { Suspense } from 'react';
import './index.css';
import Hero from './components/Hero';

// Lazy load other components
const About = React.lazy(() => import('./components/About'));
const Projects = React.lazy(() => import('./components/Projects'));
const Contact = React.lazy(() => import('./components/Contact'));

function App() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Suspense fallback={<div className="text-center p-10">Loading page sections...</div>}>
        <About />
        <Projects />
        <Contact />
      </Suspense>
    </div>
  );
}

export default App;