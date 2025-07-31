import GlassmorphicCard from './GlassmorphicCard';

const sectionAnimation = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const About = () => {
  return (
    <section className="section" id="about">
      <div className="container">
        <GlassmorphicCard
          variants={sectionAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            About Me
          </h2>
          <div className="max-w-3xl mx-auto text-center">
            <p className="mb-6">
              I've navigated a fascinating path from mechanical engineering foundations to the forefront of artificial intelligence, creating bridges between disciplines that few can effectively span. This journey has not just been about acquiring skills; it reflects my deeper understanding that meaningful innovation happens at intersections.
            </p>
            <p className="mb-6">
              I have consistently sought knowledge that transcends traditional boundaries.
            </p>
            <p>
              I stand as a beacon of innovation in our growing tech ecosystem, someone who is not just adapting to the acceleration of technological change but actively driving it forward with strategic vision and technical depth.
            </p>
          </div>
        </GlassmorphicCard>
      </div>
    </section>
  )
}

export default About
