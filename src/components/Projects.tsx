import { motion } from 'framer-motion'

interface Project {
  title: string;
  description: string;
  href?: string;
  tags: string[];
  color: string;
  image?: string; 
}

const projects: Project[] = [{
  title: 'HealthTrackNG',
  description: 'A health app aimed at helping users manage and improve their health, with features like tracking vital signs, fitness goals, and nutritional intake.',
  tags: ["Product Management", "HealthTech", "Mobile App", "Data Analysis"],
  color: "from-green-500 to-teal-500",
  image: "/images/HealthTrack Logo.png",
},
  {
    title: 'TechiesMatch',
    description: 'A dating app designed specifically for individuals in the tech industry, aiming to connect users based on shared interests in technology and career paths.',
    href: "https://techie.love",
    tags: ["Product Strategy", "Social Networking", "Mobile App", "User Engagement"],
    image: "/images/Social medial Logo 3.png",
    color: "from-blue-500 to-cyan-500",
  },
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
            <div key={index}> 
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
               {project.href && (
              <a href={project.href} target="_blank" rel="noopener noreferrer"> 
              </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Projects