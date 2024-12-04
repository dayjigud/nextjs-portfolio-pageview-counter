import { Cloud, Briefcase } from 'lucide-react'
import { motion } from 'framer-motion'

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10 animate-gradient"></div>
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
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Cloud className="w-8 h-8 text-blue-600" />
          </motion.div>
        </motion.div>
        <motion.h1 
          className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Cloud-Powered Product Mastery
        </motion.h1>
        <motion.p 
          className="text-xl text-gray-700 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          Product Manager & Cloud Engineering Enthusiast
        </motion.p>
      </div>
    </div>
  )
}

export default Hero