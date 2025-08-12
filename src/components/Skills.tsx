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

const sectionAnimation = {
  hidden: { opacity: 0, y: 50, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      type: 'spring',
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.1,
    },
  },
};

const skillAnimation = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};

const accentColors = ['bg-accent', 'bg-accent-2', 'bg-accent-3'];

const Skills = () => {
  return (
    <section className="section" id="skills">
      <div className="container">
        <motion.div
          className="bg-secondary rounded-2xl shadow-clay p-8 md:p-12"
          variants={sectionAnimation}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Skills & Expertise
          </h2>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={sectionAnimation}
          >
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-2xl shadow-clay ${accentColors[index % accentColors.length]}`}
                variants={skillAnimation}
                whileHover={{ scale: 1.1, y: -5, transition: { type: 'spring', stiffness: 300 } }}
              >
                <CheckCircle className="text-text-dark flex-shrink-0" />
                <span className="font-semibold">{skill}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Skills;
