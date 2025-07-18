import { motion } from 'framer-motion';
import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';

interface Project {
  title: string;
  description: string;
  href?: string;
  detailedDescription?: string;
  tags: string[];
  image?: string;
}

const projects: Project[] = [
  {
    title: 'HealthTrackNG',
    description: 'A health app aimed at helping users manage and improve their health, with features like tracking vital signs, fitness goals, and nutritional intake.',
    href: "https://healthtrack-ng-connect.vercel.app",
    tags: ["Product Management", "HealthTech", "Mobile App", "Data Analysis"],
    image: "/images/HealthTrack Logo.png",
  },
  {
    title: 'TechiesMatch',
    description: 'Led the development and strategy for TechiesMatch, an innovative dating application designed exclusively for tech professionals.',
    detailedDescription: `As a Product Manager, I led the development and strategy for TechiesMatch, an innovative dating application designed exclusively for tech professionals. My primary focus was on delivering a user-centric product that fosters meaningful connections, while also building a sustainable business model within the dynamic Nigerian market. I defined the product vision, translated it into a clear roadmap, and prioritized core features for the MVP. I spearheaded the conceptualization of key features like profile creation, enhanced discovery, and seamless communication. I also designed and implemented a comprehensive freemium business model.`,
    href: "https://techie.love",
    tags: ["Product Strategy", "Social Networking", "Mobile App", "User Engagement"],
    image: "/images/Social medial Logo 3.png",
  },
  {
    title: 'AI Product Innovation',
    description: 'Spearheaded the development of cutting-edge AI products at Brightyield, focusing on practical applications that address real-world challenges in the Nigerian market.',
    tags: ["AI", "Product Management", "Innovation"],
  },
  {
    title: 'HNG Internship Finalist',
    description: 'Active participation in the HNG internship program, demonstrating commitment to continuous learning and community engagement in Nigeria\'s tech ecosystem.',
    tags: ["Community", "Internship", "Tech"],
  },
];

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section className="section" id="projects">
      <div className="container">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          My Projects
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <motion.div
              key={project.title}
              className="card cursor-pointer"
              onClick={() => setSelectedProject(project)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5 }}
            >
              {project.image && <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                <p className="text-text-dark mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-primary text-text-dark rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-secondary p-8 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <button onClick={() => setSelectedProject(null)} className="absolute top-4 right-4 text-text-dark hover:text-white">
              <X size={24} />
            </button>
            <h3 className="text-3xl font-bold mb-4">{selectedProject.title}</h3>
            <p className="text-text-dark mb-6">{selectedProject.detailedDescription || selectedProject.description}</p>
            {selectedProject.href && (
              <a
                href={selectedProject.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center gap-2"
              >
                Visit Project <ExternalLink size={18} />
              </a>
            )}
          </motion.div>
        </div>
      )}
    </section>
  )
}

export default Projects;