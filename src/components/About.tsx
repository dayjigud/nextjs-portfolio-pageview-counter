import { Target, Server } from 'lucide-react'
import { motion } from 'framer-motion'

const About = () => {
  return (
    <div className="py-20 bg-gray-50 px-4">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          About Me
        </motion.h2>
        <motion.div
          className="text-gray-700 text-center mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
            <p>
            As a product manager with a unique background in Mechanical Engineering and Finance, I bridge the gap between technical innovation and strategic business growth. My journey, starting at ShellNG and expanding into founding "Brightyield," has equipped me with a diverse skill set that spans from hands-on engineering to navigating the complexities of financial markets. I'm passionate about leveraging my experience in Software Engineering, AI Engineering, and Cybersecurity to drive product development.
            </p>
            </motion.div>
            <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}>

        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        > 
          
          Skills
          </motion.h2>
        </motion.div>
        {/* Market Research Section Removed */}
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
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• User Research </motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Roadmap Planning </motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Agile Project Management </motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Data Analysis </motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Stakeholder Management </motion.li>
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
  )
}

export default About;


