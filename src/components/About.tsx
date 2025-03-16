import { Target, Server } from 'lucide-react'
import { motion } from 'framer-motion'

const About = () => {
  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2
          className="text-4xl font-bold text-center mb-8 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Who I am
        </motion.h2>
        <motion.p
          className="text-gray-700 text-center mb-16 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          
        </motion.p> 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}>
        <motion.p className="text-gray-700 text-center mb-16 leading-relaxed">
          Hey there! I'm a passionate individual with a diverse background, bridging the worlds of engineering and finance with a strong tech focus. My journey began in the field of Mechanical Engineering with ShellNG, where I honed my analytical and problem-solving skills. Branching out, I founded "Brightyield," a finance firm where I gained first-hand experience in the financial world. On the technical front, I have expertise in Software Engineering, encompassing Frontend and Backend Development. My interest doesn't stop there, as I'm also deeply involved in the cutting-edge fields of AI Engineering and Cybersecurity. I believe in blending technical prowess with strategic thinking to build innovative solutions.
        </motion.p>
        <motion.h2
          className="text-4xl font-bold text-center mb-16 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          
          Skills
          </motion.h2>
        </motion.div>
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

export default About;


