import { lazy, Suspense } from 'react'
import './index.css'
import Hero from './components/Hero'
// import About from './components/About'
// import Projects from './components/Projects'
// import Contact from './components/Contact'

const About = lazy(() => import('./components/About'))
const Projects = lazy(() => import('./components/Projects'))
const Contact = lazy(() => import('./components/Contact'))
const TechnologyLeadership = lazy(() => import('./components/TechnologyLeadership'))

function App() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Suspense fallback={<div>Loading...</div>}>
        <About />
        <Projects />
        <TechnologyLeadership />
        <Contact />
      </Suspense>
    </div>
  )
}

export default App