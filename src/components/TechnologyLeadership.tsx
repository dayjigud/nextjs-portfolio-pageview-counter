import { motion } from 'framer-motion'

const TechnologyLeadership = () => {
  return (
    <div className="py-20 bg-gray-50 px-4">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Driving Innovation in Nigeria's Tech Ecosystem
        </motion.h2>
        <motion.div
          className="text-gray-700 text-center mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
            <p>
            As a technological polymath, I thrive at the intersection of multiple disciplines, bringing together mechanical engineering foundations with cutting-edge AI innovation. My interdisciplinary approach makes me exceptionally valuable in translating complex technical concepts into strategic business solutions.
            </p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-12">
            <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <h3 className="text-2xl font-semibold text-purple-600 flex items-center gap-2">
                    Team Leadership
                </h3>
                <p className='text-gray-700'>Leading diverse teams with technical expertise and strategic vision</p>
            </motion.div>
            <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <h3 className="text-2xl font-semibold text-blue-600 flex items-center gap-2">
                    Innovation Driver
                </h3>
                <p className='text-gray-700'>Anticipating and implementing emerging technologies</p>
            </motion.div>
            <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <h3 className="text-2xl font-semibold text-green-600 flex items-center gap-2">
                    Regional Impact
                </h3>
                <p className='text-gray-700'>Shaping Africa's technological narrative with global relevance</p>
            </motion.div>
        </div>
    </div>
  )
}

export default TechnologyLeadership
