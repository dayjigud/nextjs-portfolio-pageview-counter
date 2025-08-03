import { motion } from 'framer-motion';
import WavyTextReveal from './WavyTextReveal'; // Assuming WavyTextReveal is created

const Hero = () => {
  const tagline = "AI Product Manager | Technology Innovator | Data Analyst";

  return (
    <section className="h-screen flex items-center justify-center text-center" id="home">
      <div className="container">
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Ayodeji Adeniyi
        </motion.h1>
        
        {/* Using the new WavyTextReveal component for the tagline */}
        <WavyTextReveal text={tagline} />

        <motion.p
          className="max-w-3xl mx-auto my-8 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          A Technological Polymath bridging mechanical engineering foundations with cutting-edge AI innovation in Nigeria's evolving tech landscape.
        </motion.p>
        <motion.a
          href="#contact"
          className="btn bg-accent text-white hover:bg-opacity-80"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 2 }}
        >
          Get in Touch
        </motion.a>
      </div>
    </section>
  );
};

export default Hero;
