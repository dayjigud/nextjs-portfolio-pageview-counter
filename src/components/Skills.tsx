import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

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

const Skills = () => {
  return (
    <section className="section" id="skills">
      <div className="container">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Skills & Expertise
        </motion.h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-4 p-4 bg-secondary rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <CheckCircle className="text-accent" />
              <span>{skill}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
