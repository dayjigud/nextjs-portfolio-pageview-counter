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
    title: 'StudyZen',
    description: 'A productivity app to help students focus on their studies with features for concentration, task management, progress tracking, and schedule optimization.',
    href: "https://studyzen-phi.vercel.app/",
    tags: ["Productivity", "EdTech", "Web App", "Task Management"],
    image: "/images/StudyZen Logo.svg",
  },
];

const Projects = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section className="section" id="projects">
      <div className="container">
        <div
          className="bg-accent-2 rounded-2xl shadow-clay p-8 md:p-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            My Projects
          </h2>
          <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {projects.map((project) => (
              <div
                key={project.title}
                className="card cursor-pointer bg-primary"
                onClick={() => setSelectedProject(project)}
              >
                {project.image && <img src={project.image} alt={project.title} className="w-full h-48 object-cover rounded-t-2xl" />}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-text-dark mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-secondary text-text-dark rounded-full text-sm shadow-clay-inset">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className="bg-secondary p-8 rounded-2xl shadow-clay max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
          >
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 text-text-dark"
            >
              <X size={24} />
            </button>
            <h3 className="text-3xl font-bold mb-4 gradient-text">{selectedProject.title}</h3>
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
          </div>
        </div>
      )}
    </section>
  )
}

export default Projects;