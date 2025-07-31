import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';
import GlassmorphicCard from './GlassmorphicCard';

const experiences = [
  {
    role: 'AI Product Manager',
    company: 'Brightyield Golden Resources Limited',
    description: 'Leading AI product development initiatives, leveraging interdisciplinary expertise to drive innovation in Nigeria\'s tech landscape. I manage the complete product lifecycle from concept to deployment, ensuring AI solutions meet market needs while maintaining technical excellence.',
  },
  {
    role: 'Data Analyst',
    company: 'Self-Employed',
    description: 'Specialized in extracting actionable insights from complex datasets, developing data-driven solutions that informed strategic business decisions. Built foundational expertise in machine learning and statistical analysis that now supports my AI product management role.',
  },
];

const sectionAnimation = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const Experience = () => {
  return (
    <section className="section" id="experience">
      <div className="container">
        <GlassmorphicCard
          variants={sectionAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <h2
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            Professional Experience
          </h2>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-0.5 bg-secondary"></div>
            {experiences.map((exp, index) => (
              <div key={index} className="flex items-center w-full mb-16">
                <div className="w-1/2 flex justify-end pr-8">
                  {index % 2 === 0 && (
                    <motion.div
                      className="max-w-md"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className="text-2xl font-bold text-right">{exp.role}</h3>
                      <p className="text-accent text-right mb-2">{exp.company}</p>
                      <p className="text-text-dark text-right">{exp.description}</p>
                    </motion.div>
                  )}
                </div>
                <div className="w-1/2 flex justify-start pl-8">
                  {index % 2 !== 0 && (
                    <motion.div
                      className="max-w-md"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      <h3 className="text-2xl font-bold">{exp.role}</h3>
                      <p className="text-accent mb-2">{exp.company}</p>
                      <p className="text-text-dark">{exp.description}</p>
                    </motion.div>
                  )}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 bg-primary border-2 border-accent rounded-full p-2">
                  <Briefcase className="text-accent" />
                </div>
              </div>
            ))}
          </div>
        </GlassmorphicCard>
      </div>
    </section>
  );
};

export default Experience;

