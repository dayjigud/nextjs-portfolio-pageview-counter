# Feature Implementation Plan: Refactor Dark Mode UI

## 📋 Todo Checklist
- [x] ~~Configure `tailwind.config.js` with new brand colors.~~ ✅ Implemented
- [x] ~~Apply new global styles in `src/index.css`.~~ ✅ Implemented
- [x] ~~Refactor the `Hero` component with a new layout and typing animation.~~ ✅ Implemented
- [x] ~~Refactor the `Skills` component with floating card animations.~~ ✅ Implemented
- [x] ~~Refactor the `Projects` component with a new card design and icons.~~ ✅ Implemented
- [x] ~~Create the new `WavyTextReveal` component.~~ ✅ Implemented
- [x] ~~Final Review and Testing.~~ ✅ Implemented

## 🔍 Analysis & Investigation

### Codebase Structure
The project is a standard Vite + React + TypeScript setup. Core components are located in `src/components/`. Global styles are in `src/index.css`, and the Tailwind configuration is in `tailwind.config.js`. The structure is modular and straightforward, making component-based refactoring easy to manage.

### Current Architecture
The application uses a single-page architecture with components for each section (`Hero`, `Skills`, `Projects`, etc.). State management is handled locally within components using `React.useState`. Animations are already being handled by `framer-motion`, and icons by `lucide-react`, which aligns perfectly with the requested refactoring. The existing `GlassmorphicCard` component can be repurposed or replaced as needed to fit the new aesthetic.

### Dependencies & Integration Points
- **`react`**: Core library.
- **`tailwindcss`**: For utility-first styling. The plan will extend its theme.
- **`framer-motion`**: For animations. The plan will leverage it for more complex and dynamic UI effects.
- **`lucide-react`**: For icons. The plan will use its icons in the `Projects` component.

### Considerations & Challenges
- **Animation Complexity**: The "wavy text reveal" is a complex animation that will require careful implementation with Framer Motion's variants and potentially custom CSS to achieve the desired effect.
- **Responsive Design**: All new components and styles must be fully responsive. The use of Tailwind's responsive prefixes (`md:`, `lg:`) will be crucial.
- **Aesthetic Consistency**: Ensuring the new dark-mode, high-contrast style is applied consistently across all refactored components is key to a successful redesign.

## 📝 Implementation Plan

### Prerequisites
No new dependencies are required. Ensure you have `npm` or `yarn` installed to run the development server (`npm run dev`) to preview changes.

### Step-by-Step Implementation

#### 1. Configure Tailwind (`tailwind.config.js`)
Update the theme to include the new brand colors for accents.

- **Files to modify**: `tailwind.config.js`
- **Changes needed**: Extend the `theme.colors` object.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1D2430', // Existing color
        'secondary': '#2A323F', // Existing color
        'accent': '#3A8DFF', // Existing color
        'text-light': '#FFFFFF', // Existing color
        'text-dark': '#B0B5B3', // Existing color
        // Add new brand colors
        'brand-yellow': '#FFFF00',
        'brand-purple': '#8A2BE2',
        'brand-green': '#32CD32',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'], // Change font
        'display': ['Montserrat', 'sans-serif'],
      },
      // ... rest of the config
    },
  },
  plugins: [],
}
```

#### 2. Set Global Styles (`src/index.css`)
Apply the base dark-mode styles and import the new font.

- **Files to modify**: `src/index.css`
- **Changes needed**: Update the `body` styles and the font import.

```css
/* Import the Inter font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  /* Set new background and text colors */
  @apply bg-black text-gray-300 font-sans;
}

h1, h2, h3, h4, h5, h6 {
  @apply font-display text-white;
}

/* Keep other styles like .section, .container, etc. */
.section {
  @apply py-20 px-4 sm:px-6 lg:px-8;
}

.container {
  @apply max-w-7xl mx-auto;
}

/* ... rest of the styles */
```

#### 3. Refactor Hero Component (`src/components/Hero.tsx`)
Update the layout to be centered and add a typing animation to the tagline.

- **Files to modify**: `src/components/Hero.tsx`
- **Changes needed**: Replace the existing component code with the new version.

```typescript
import { motion } from 'framer-motion';
import WavyTextReveal from './WavyTextReveal'; // Assuming WavyTextReveal is created

const Hero = () => {
  const tagline = "AI Product Manager | Technology Innovator | Data Analyst";

  return (
    <section className="h-screen flex items-center justify-center text-center" id="home">
      <div className="container">
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Ayodeji Adeniyi
        </motion.h1>
        
        {/* Using the new WavyTextReveal component for the tagline */}
        <WavyTextReveal text={tagline} />

        <motion.p
          className="max-w-3xl mx-auto my-8 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          A Technological Polymath bridging mechanical engineering foundations with cutting-edge AI innovation in Nigeria's evolving tech landscape.
        </motion.p>
        <motion.a
          href="#contact"
          className="btn bg-brand-yellow text-black hover:bg-opacity-80"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 2 }}
        >
          Get in Touch
        </motion.a>
      </div>
    </section>
  );
};

export default Hero;
```

#### 4. Refactor Skills Component (`src/components/Skills.tsx`)
Style skills as floating/drifting cards.

- **Files to modify**: `src/components/Skills.tsx`
- **Changes needed**: Replace the component code to implement the new card design and animations.

```typescript
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
```

#### 5. Refactor Projects Component (`src/components/Projects.tsx`)
Redesign project listings into distinct cards with Lucide icons.

- **Files to modify**: `src/components/Projects.tsx`
- **Changes needed**: Replace the component code to use the new card design.

```typescript
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

// Assuming the Project interface and projects array are defined in this file as before

const projects = [
  // ... same project data
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
```

#### 6. Create Wavy Text Reveal Component (`src/components/WavyTextReveal.tsx`)
Generate a new, reusable component for the wavy text animation.

- **Files to create**: `src/components/WavyTextReveal.tsx`
- **Changes needed**: Create the file and add the following code.

```typescript
import { motion, Variants } from 'framer-motion';
import React from 'react';

interface WavyTextRevealProps {
  text: string;
  className?: string;
}

const WavyTextReveal: React.FC<WavyTextRevealProps> = ({ text, className }) => {
  const words = text.split(' ');

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i: number = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      transition: { type: 'spring', damping: 12, stiffness: 100 },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 12, stiffness: 100 },
    },
  };

  const colors = ['#FFFF00', '#8A2BE2', '#32CD32']; // brand-yellow, brand-purple, brand-green

  return (
    <motion.div
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, index) => (
        <motion.div
          key={index}
          variants={child}
          style={{
            marginRight: '8px',
            overflow: 'hidden',
            padding: '2px 6px',
            borderRadius: '6px',
            backgroundColor: colors[index % colors.length],
            color: '#000', // Black text for contrast on bright backgrounds
          }}
          // Wavy animation
          animate={{
            y: [0, -5, 5, -5, 0],
            transition: {
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
              delay: index * 0.1
            }
          }}
        >
          {word}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default WavyTextReveal;
```

### Testing Strategy
1.  **Code Review**: Manually review the code changes for correctness, adherence to the plan, and style consistency.
2.  **Component Logic Review**: Mentally trace the logic of the refactored components (`Hero`, `Skills`, `Projects`) to ensure they should render correctly and that animations are configured as expected.
3.  **Responsiveness Review**: Review the Tailwind CSS classes used to ensure they correctly target different screen sizes (mobile, tablet, desktop).
4.  **Functionality Review**: Manually verify that all links, buttons, and interactive elements have the correct `href` attributes and event handlers.
5.  **Cross-browser Consideration**: Keep in mind cross-browser compatibility best practices when reviewing the code.

## 🎯 Success Criteria
The refactoring is complete when:
- The application has a consistent dark-mode theme inspired by the "PopUp.Fund" aesthetic.
- All specified animations (typing, floating cards, wavy text) are implemented correctly.
- The UI is fully responsive and functional across all modern browsers.
- The code is clean, well-typed, and follows existing project conventions.
- The new `WavyTextReveal` component is reusable and correctly integrated.
