import { lazy, Suspense } from 'react'
import './index.css'
import Hero from './components/Hero'
import Header from './components/Header'
import Footer from './components/Footer'

const About = lazy(() => import('./components/About'))
const Projects = lazy(() => import('./components/Projects'))
const Contact = lazy(() => import('./components/Contact'))
const Experience = lazy(() => import('./components/Experience'))
const Skills = lazy(() => import('./components/Skills'))

function App() {
  return (
    <div className="bg-primary">
      <Header />
      <main>
        <Hero />
        <Suspense fallback={<div>Loading...</div>}>
          <About />
          <Projects />
          <Experience />
          <Skills />
          <Contact />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}

export default App