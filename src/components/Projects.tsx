import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

// Assuming the Project interface and projects array are defined in this file as before

const projects = [
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
    title: 'StudyZen',
    description: 'A productivity app to help students focus on their studies with features for concentration, task management, progress tracking, and schedule optimization.',
    href: "https://studyzen-phi.vercel.app/",
    tags: ["Productivity", "EdTech", "Web App", "Task Management"],
    image: "/images/StudyZen Logo.svg",
  },
];

const Projects = () => {
  return (
    <section className="section" id="projects">
      <div className="container">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
          My Projects
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              className="group relative flex flex-col bg-gray-900 border border-gray-800 rounded-lg overflow-hidden p-6 transition-all duration-300 hover:border-brand-purple"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {project.image && <img src={project.image} alt={project.title} className="w-full h-48 object-cover mb-4 rounded-md" />}
              <h3 className="text-2xl font-bold mb-2 text-white">{project.title}</h3>
              <p className="text-gray-400 mb-4 flex-grow">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-800 text-brand-green rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              {project.href && (
                <a
                  href={project.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-brand-yellow mt-auto transition-transform duration-300 group-hover:translate-x-1"
                >
                  Visit Project
                  <ArrowUpRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-45" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;