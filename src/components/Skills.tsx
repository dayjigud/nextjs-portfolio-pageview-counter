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

const accentColors = ['bg-accent', 'bg-accent-2', 'bg-accent-3'];

const Skills = () => {
  return (
    <section className="section" id="skills">
      <div className="container">
        <div
          className="bg-secondary rounded-2xl shadow-clay p-8 md:p-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Skills & Expertise
          </h2>
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {skills.map((skill, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-2xl shadow-clay ${accentColors[index % accentColors.length]}`}
              >
                <CheckCircle className="text-text-dark flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold break-words">{skill}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
