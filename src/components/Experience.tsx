import { Briefcase } from 'lucide-react';

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

const Experience = () => {
  return (
    <section className="section" id="experience">
      <div className="container">
        <div
          className="bg-accent-3 rounded-2xl shadow-clay p-8 md:p-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Professional Experience
          </h2>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-1 bg-secondary rounded-full"></div>
            {experiences.map((exp, index) => (
              <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} w-full mb-16`}>
                <div className="w-1/2">
                  <div
                    className="bg-primary p-6 rounded-2xl shadow-clay"
                  >
                    <h3 className="text-2xl font-bold">{exp.role}</h3>
                    <p className="text-accent-2 font-semibold mb-2">{exp.company}</p>
                    <p className="text-text-dark">{exp.description}</p>
                  </div>
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-secondary border-4 border-primary rounded-full p-3 shadow-clay">
                  <Briefcase className="text-text-dark" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;

