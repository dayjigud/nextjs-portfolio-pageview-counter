import { Target, Layout, Monitor, Server } from 'lucide-react'
import { motion } from 'framer-motion'

const About = () => {
  return (
    <div className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2 
          className="text-4xl font-bold text-center mb-16 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          About Me
        </motion.h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-semibold text-purple-600 flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Target className="w-6 h-6" />
              </motion.div>
              Product Skills
            </h3>
            <ul className="space-y-3 text-gray-700">
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Product Strategy</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• User Research</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Roadmap Planning</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Agile Development</motion.li>
            </ul>
          </motion.div>
          
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-semibold text-blue-600 flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Server className="w-6 h-6" />
              </motion.div>
              Cloud Journey
            </h3>
            <ul className="space-y-3 text-gray-700">
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• AWS Fundamentals</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Docker & Containers</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• CI/CD Pipelines</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Infrastructure as Code</motion.li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default About