import { m } from 'framer-motion'

const Hero = () => {
  return (
    <section className="section pt-28" id="home">
      <div className="container text-center">
        <m.div
          className="bg-secondary rounded-2xl shadow-clay p-8 md:p-12"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
            duration: 0.6,
          }}
        >
          <m.h1
            className="text-4xl md:text-6xl font-bold mb-4 gradient-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Ayodeji Adeniyi
          </m.h1>
          <m.p
            className="text-lg md:text-xl text-text-dark font-semibold mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            AI Product Manager | Technology Innovator | Data Analyst
          </m.p>
          <m.p
            className="max-w-3xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            A Technological Polymath bridging mechanical engineering foundations with cutting-edge AI innovation in Nigeria's evolving tech landscape.
          </m.p>
          <m.a
            href="#contact"
            className="btn btn-primary"
            whileHover={{ scale: 1.1, y: -2, transition: { type: 'spring', stiffness: 300 } }}
            whileTap={{ scale: 0.9 }}
          >
            Get in Touch
          </m.a>
        </m.div>
      </div>
    </section>
  )
}

export default Hero