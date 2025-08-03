import { motion } from 'framer-motion';

const skills = [
  'AI Product Management', 'Data Analysis', 'Cloud Technology',
  'Security', 'Finance', 'Mechanical Engineering',
  'Innovation', 'Strategic Thinking', 'Product Strategy', 'Web3'
];

const Skills = () => {
  return (
    <section className="section" id="skills">
      <div className="container text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-12">
          Skills & Expertise
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {skills.map((skill, index) => (
            <motion.div
              key={index}
              className="px-6 py-3 bg-gray-900 border border-gray-700 rounded-full text-lg"
              // Subtle, continuous floating animation
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2, // Random duration for variation
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: Math.random() * 2, // Random delay
              }}
            >
              {skill}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;