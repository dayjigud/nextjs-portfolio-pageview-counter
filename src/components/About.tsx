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
          The Bridge Builder on a Meaningful Journey
        </motion.h2>
        <motion.div
          className="text-gray-700 text-center mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
            <p>
            I've navigated a fascinating path from mechanical engineering foundations to the cutting edge of artificial intelligence, creating bridges between disciplines that few can effectively span. This journey hasn't just been about acquiring skills—it reflects my deeper understanding that meaningful innovation happens at intersections. From my education at Afe Babalola University to my current role managing AI products at Brightyield Golden Resources Limited, I've consistently sought knowledge that transcends traditional boundaries. There's something profoundly meaningful in how I've cultivated expertise across finance, security, and cloud technologies while maintaining my technical core. Based in Abuja, Nigeria, I stand as a beacon of innovation in our growing tech ecosystem—someone who isn't just adapting to the acceleration of technological change but actively driving it forward with strategic vision and technical depth.
            </p>
        </motion.div>
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Professional Experience
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-12 mb-16">
            <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <h3 className="text-2xl font-semibold text-purple-600 flex items-center gap-2">
                    AI Product Manager
                </h3>
                <p className='text-gray-700'>Brightyield Golden Resources Limited</p>
                <p className='text-gray-700'>Leading AI product development initiatives at Brightyield Golden Resources Limited, where I leverage my interdisciplinary expertise to drive innovation in Nigeria's tech landscape. I manage the complete product lifecycle from concept to deployment, ensuring AI solutions meet market needs while maintaining technical excellence.</p>
            </motion.div>
            <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <h3 className="text-2xl font-semibold text-blue-600 flex items-center gap-2">
                    Data Analyst
                </h3>
                <p className='text-gray-700'>Specialized in extracting actionable insights from complex datasets, developing data-driven solutions that informed strategic business decisions. Built foundational expertise in machine learning and statistical analysis that now supports my AI product management role.</p>
            </motion.div>
        </div>
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Skills & Expertise
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <ul className="space-y-3 text-gray-700">
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• AI Product Management: Strategic AI product development and lifecycle management</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Data Analysis: Advanced data processing and insights generation</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Cloud Technology: Cloud architecture and infrastructure management</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Security: Cybersecurity and risk management solutions</motion.li>
            </ul>
          </motion.div>
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <ul className="space-y-3 text-gray-700">
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Finance: Financial technology and analytics</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Mechanical Engineering: Engineering fundamentals and system design</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Innovation: Technology evangelism and strategic thinking</motion.li>
            </ul>
          </motion.div>
          </div>
    </div>
  )
}

export default About;


