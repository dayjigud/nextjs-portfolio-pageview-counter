import { motion } from 'framer-motion'

const About = () => {
  return (
    <section className="section" id="about">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            About Me
          </h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="mb-6">
              I've navigated a fascinating path from mechanical engineering foundations to the cutting edge of artificial intelligence, creating bridges between disciplines that few can effectively span. This journey hasn't just been about acquiring skills—it reflects my deeper understanding that meaningful innovation happens at intersections.
            </p>
            <p className="mb-6">
              From my education at Afe Babalola University to my current role managing AI products at Brightyield Golden Resources Limited, I've consistently sought knowledge that transcends traditional boundaries.
            </p>
            <p>
              Based in Abuja, Nigeria, I stand as a beacon of innovation in our growing tech ecosystem—someone who isn't just adapting to the acceleration of technological change but actively driving it forward with strategic vision and technical depth.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default About
