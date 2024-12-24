import { motion } from 'framer-motion'

const projects = [
  {
    title: 'Aimagine',
    description: 'AI Image generator using hugginface API',
    href: "https://aimagine.lovable.app/",
    tags: ["AI", "React", "Hugging Face", "Next.js"],
    color: "from-purple-500 to-pink-500",
    image: "/images/image1.jpeg"
  },
  {
    title: "Cloud Dashboard",
    description: "Monitoring dashboard for cloud resources with real-time updates",
    tags: ["Design System", "Cloud", "Analytics"],
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Mobile App Design",
    description: "User-centric mobile application with serverless backend",
    tags: ["Mobile", "Lambda", "UI Design"],
    color: "from-green-500 to-teal-500"
  }
]

const Projects = () => {
  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2 
          className="text-4xl font-bold text-center mb-16 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Projects
        </motion.h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <a href={project.href} key={index} target="_blank" rel="noopener noreferrer"> 
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 relative"
              >
                {project.image && (
                  <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />
                )}
                {!project.image && (
                  <div className={`w-full h-48 bg-gradient-to-r ${project.color}`} />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                  <p className="text-gray-600 mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags?.map((tag, tagIndex) => (
                      <motion.span 
                        key={tagIndex}
                        whileHover={{ scale: 1.05 }}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Projects