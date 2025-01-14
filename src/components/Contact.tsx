import { Github, Linkedin, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

const Contact = () => {
  return (
    <div className="py-20 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 text-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <motion.h2 
          className="text-4xl font-bold mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Let's Connect
        </motion.h2>
        <motion.p 
          className="text-xl mb-12 opacity-90"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Open for collaborations and opportunities
        </motion.p>
        
        <div className="flex justify-center gap-8">
          {[
            { icon: Mail, href: "mailto:dayjigud@gmail.com" },
            { icon: Github, href: "https://github.com/dayjigud" },
            { icon: Linkedin, href: "https://linkedin.com/in/dayjigud" },
          ].map((item, index) => (
            <motion.a 
              key={index}
              href={item.href}
              className="p-4 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-300"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <item.icon className="w-6 h-6" />
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Contact