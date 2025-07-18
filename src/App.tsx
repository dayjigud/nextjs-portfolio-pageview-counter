import { lazy, Suspense } from 'react'
import './index.css'
import Hero from './components/Hero'
import Header from './components/Header'
import Footer from './components/Footer'
import Experience from './components/Experience'
import Skills from './components/Skills'

const About = lazy(() => import('./components/About'))
const Projects = lazy(() => import('./components/Projects'))
const Contact = lazy(() => import('./components/Contact'))

function App() {
  return (
    <div className="bg-primary">
      <Header />
      <main>
        <Hero />
        <Suspense fallback={<div>Loading...</div>}>
          <About />
          <Experience />
          <Skills />
          <Projects />
          <Contact />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default App