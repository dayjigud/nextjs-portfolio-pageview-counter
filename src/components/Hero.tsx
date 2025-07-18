import { Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10 animate-gradient"></div>
      
      {/* Portrait Circle */}
      <motion.div
        className="absolute top-8 right-8 z-20"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.8 
        }}
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white p-1"
          >
            <div 
              className="w-full h-full rounded-full bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('https://imgur.com/z5dzRlj.jpg')" // Replace with your actual portrait URL
              }}
            />
          </motion.div>
        </div>
      </motion.div>

      <div className="relative z-10 text-center px-4">
        <motion.div 
          className="flex justify-center gap-4 mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Briefcase className="w-8 h-8 text-purple-600" />
          </motion.div>
          </motion.div>
        <motion.h1 
          className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Ayodeji Adeniyi
        </motion.h1>
        <motion.p 
          className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          AI Product Manager | Technology Innovator | Data Analyst
        </motion.p>
        <motion.p
            className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
        >
            The Technological Polymath bridging mechanical engineering foundations with cutting-edge AI innovation in Nigeria's evolving tech landscape
        </motion.p>
      </div>
    </div>
  )
}

export default Hero