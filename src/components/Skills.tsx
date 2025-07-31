import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import GlassmorphicCard from './GlassmorphicCard';

const skills = [
  'AI Product Management',
  'Data Analysis',
  'Cloud Technology',
  'Security',
  'Finance',
  'Mechanical Engineering',
  'Innovation',
  'Strategic Thinking',
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

const Skills = () => {
  return (
    <section className="section" id="skills">
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
            Skills & Expertise
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                className="flex items-center gap-4 p-4 bg-primary rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, y: -5, transition: { type: 'spring', stiffness: 300 } }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <CheckCircle className="text-accent" />
                <span>{skill}</span>
              </motion.div>
            ))}
          </div>
        </GlassmorphicCard>
      </div>
    </section>
  );
};

export default Skills;
