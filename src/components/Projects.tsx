import { motion } from 'framer-motion';
import { useState } from 'react';

interface Project {
  title: string;
  description: string;
  href?: string;
  detailedDescription?: string;
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
    description: 'Led the development and strategy for TechiesMatch, an innovative dating application designed exclusively for tech professionals, focusing on user-centric features and a sustainable business model in the Nigerian market.',
    detailedDescription: `Product Manager Role: TechiesMatch – Connecting Tech Professionals
  Overview:
  As a Product Manager, I led the development and strategy for TechiesMatch, an innovative dating application designed exclusively for tech professionals. My primary focus was on delivering a user-centric product that fosters meaningful connections, while also building a sustainable business model within the dynamic Nigerian market.
  My Contributions & Key Responsibilities:
   * Strategic Product Vision & Roadmap: I defined the product vision for TechiesMatch, translating it into a clear roadmap for our Minimum Viable Product (MVP) and subsequent iterations. This involved prioritizing core features for the initial release, ensuring we built a foundational product that captivated users from day one. I also strategically decided to exclude features like Compatibility Trivia and Profile Filters from the MVP to streamline development and time-to-market, with plans for future integration based on user feedback and market value.
   * User-Centric Feature Development: I spearheaded the conceptualization and detailed definition of key features, always with the user experience at the forefront. This included:
     * Profile Creation & Management: Ensuring users could seamlessly create detailed profiles, upload multiple pictures, and view others' profiles in a clear, user-friendly format.
     * Enhanced Discovery & Matching: I designed the implementation of interest tagging for precise categorization and discoverability, as well as the intuitive "Swipe to Match" functionality for efficient profile interaction and mutual connections. I also integrated a "Save to Favorites" list to increase user engagement and encourage deeper exploration of the app.
     * Seamless Communication: I oversaw the development of a text-only chat feature for matched users and favorites, ensuring easy and instant connection. Furthermore, I introduced the unique "Icebreakers" feature to overcome initial conversation hurdles and spark meaningful interactions, contributing to the app's competitive differentiation.
   * Monetization Strategy & Implementation: I designed and implemented a comprehensive freemium business model for TechiesMatch, balancing a valuable free experience with compelling premium offerings. This involved:
     * Defining the value proposition for free users (limited swipes, unlimited chat).
     * Crafting tiered premium plans (Monthly, Quarterly, Annual) with competitive pricing and highly desired features like "Message Before Match," "Unlimited Swipes," and "See Who Swiped Right on Me".
     * Integrating a 3-day free trial to drive initial conversions.
     * Planning for continuous optimization through A/B testing and data analysis to maximize conversion rates and user satisfaction.
   * Cross-Functional Team Leadership: I effectively collaborated with engineering, design, and marketing teams, translating user needs and business goals into clear product requirements and acceptance criteria for each version.
  What I Offer:
  My experience with TechiesMatch demonstrates my ability to:
   * Strategically define and execute product roadmaps from concept to launch in a fast-paced environment.
   * Drive user acquisition and engagement through deeply understanding user needs and translating them into impactful features.
   * Develop robust monetization strategies that balance user value with sustainable revenue generation.
   * Lead cross-functional teams to deliver high-quality products on time and within scope.
   * Navigate and leverage insights from the Nigerian market, adapting product strategies to local cultural nuances and user behaviors.`,
    href: "https://techie.love",
    tags: ["Product Strategy", "Social Networking", "Mobile App", "User Engagement"],
    image: "/images/Social medial Logo 3.png",
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: 'AI Product Innovation',
    description: 'Spearheaded the development of cutting-edge AI products at Brightyield, focusing on practical applications that address real-world challenges in the Nigerian market.',
    tags: ["AI", "Product Management", "Innovation"],
    color: "from-purple-500 to-pink-500",
  },
  {
    title: 'HNG Internship Finalist',
    description: 'Active participation in the HNG internship program, demonstrating commitment to continuous learning and community engagement in Nigeria\'s tech ecosystem.',
    tags: ["Community", "Internship", "Tech"],
    color: "from-yellow-500 to-orange-500",
  },
  {
    title: 'Data Analytics Excellence',
    description: 'Developed comprehensive data analysis solutions that transformed raw data into actionable business insights, forming the foundation for AI-driven decision making.',
    tags: ["Data Analysis", "Business Intelligence", "AI"],
    color: "from-red-500 to-pink-500",
  },
]
const Projects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const openModal = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <motion.h2 
          className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gray-800"
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
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 relative cursor-pointer"
                onClick={() => {
                  if (project.detailedDescription) {
                    openModal(project);
                  } else if (project.href) {
                    window.open(project.href, '_blank', 'noopener,noreferrer');
                  }
                }}
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
            </div>
          ))}
        </div>

        {isModalOpen && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <h3 className="text-3xl font-bold mb-6 text-gray-900">{selectedProject.title}</h3>
              {selectedProject.detailedDescription?.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 mb-4 leading-relaxed">{paragraph.trim() || <br />}</p>
              ))}
              <div className="mt-8 flex justify-end space-x-3">
                {selectedProject.href && (
                  <a
                    href={selectedProject.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Visit Project Website
                  </a>
                )}
                <button
                  onClick={closeModal}
                  className="inline-block bg-gray-200 text-gray-800 font-medium px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Projects