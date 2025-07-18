import { motion } from 'framer-motion'

const Hero = () => {
  return (
    <section className="section" id="home">
      <div className="container text-center">
        <motion.h1
          className="text-4xl md:text-6xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Ayodeji Adeniyi
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-accent mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          AI Product Manager | Technology Innovator | Data Analyst
        </motion.p>
        <motion.p
          className="max-w-3xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          A Technological Polymath bridging mechanical engineering foundations with cutting-edge AI innovation in Nigeria's evolving tech landscape.
        </motion.p>
        <motion.a
          href="#contact"
          className="btn btn-primary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Get in Touch
        </motion.a>
      </div>
    </section>
  )
}

export default Hero