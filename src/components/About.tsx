import { Target, Server } from 'lucide-react'
import { motion } from 'framer-motion'

const About = () => {
  return (
    <div className="py-20 bg-gray-50 px-4">
        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          About Me
        </motion.h2>
        <motion.div
          className="text-gray-700 text-center mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
            <p>
            As a product manager with a unique background in Mechanical Engineering and Finance, I bridge the gap between technical innovation and strategic business growth. My journey, starting at ShellNG and expanding into founding "Brightyield," has equipped me with a diverse skill set that spans from hands-on engineering to navigating the complexities of financial markets. I'm passionate about leveraging my experience in Software Engineering, AI Engineering, and Cybersecurity to drive product development.
            </p>
            </motion.div>
            <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}>

        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-16 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        > 
          
          Skills
          </motion.h2>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5 }}>

        <motion.h2
          className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        > 
          
          Market Research
          </motion.h2>
           <div className='mb-16'>
              {/* Simulated Charts */}
              <div className="grid md:grid-cols-3 gap-8 sm:gap-12 md:gap-8 mb-8">
                {/* Bar Chart for User Preference */}
                <div className="bg-white p-4 rounded-lg shadow ">
                  <h4 className="font-semibold mb-4 text-center">User Preferences</h4>
                  <div className="bg-gray-100 h-64 relative overflow-hidden">
                     {/* Horizontal grid lines */}
                     <div className="absolute top-[20%] left-0 w-full h-[1px] bg-gray-300"></div>
                    <div className="absolute top-[40%] left-0 w-full h-[1px] bg-gray-300"></div>
                    <div className="absolute top-[60%] left-0 w-full h-[1px] bg-gray-300"></div>
                    <div className="absolute top-[80%] left-0 w-full h-[1px] bg-gray-300"></div>
                    <div className="absolute top-[100%] left-0 w-full h-[1px] bg-gray-300"></div>
                    {/* Simulate Bar Chart with simple divs */}
                    {/* UI/UX Design */}
                    <div className="absolute bottom-0 left-[5%] bg-blue-500 w-[12%] h-[80%]">
                      <span className="text-white text-[9px] xs:text-[10px] sm:text-xs absolute top-[-18px] sm:top-[-20px] left-1/2 -translate-x-1/2">80%</span>
                    </div>
                    <div className="absolute bottom-[-20px] sm:bottom-[-25px] left-[5%] w-[12%] text-center text-gray-700 text-[9px] xs:text-[10px] sm:text-xs">UI/UX</div>
                    {/* Ease of use */}
                    <div className="absolute bottom-0 left-[22%] bg-blue-400 w-[12%] h-[70%]">
                    <span className="text-white text-[9px] xs:text-[10px] sm:text-xs absolute top-[-18px] sm:top-[-20px] left-1/2 -translate-x-1/2">70%</span>
                    </div>
                    <div className="absolute bottom-[-20px] sm:bottom-[-25px] left-[22%] w-[12%] text-center text-gray-700 text-[9px] xs:text-[10px] sm:text-xs">Ease of use</div>
                    {/* Feature Richness */}
                    <div className="absolute bottom-0 left-[39%] bg-blue-300 w-[12%] h-[60%]">
                    <span className="text-white text-[9px] xs:text-[10px] sm:text-xs absolute top-[-18px] sm:top-[-20px] left-1/2 -translate-x-1/2">60%</span>
                    </div>
                    <div className="absolute bottom-[-20px] sm:bottom-[-25px] left-[39%] w-[12%] text-center text-gray-700 text-[9px] xs:text-[10px] sm:text-xs">Features</div>
                    {/* Performance */}
                    <div className="absolute bottom-0 left-[56%] bg-blue-200 w-[12%] h-[50%]">
                    <span className="text-white text-[9px] xs:text-[10px] sm:text-xs absolute top-[-18px] sm:top-[-20px] left-1/2 -translate-x-1/2">50%</span>
                    </div>
                    <div className="absolute bottom-[-20px] sm:bottom-[-25px] left-[56%] w-[12%] text-center text-gray-700 text-[9px] xs:text-[10px] sm:text-xs">Performance</div>
                    {/* Price */}
                    <div className="absolute bottom-0 left-[73%] bg-blue-100 w-[12%] h-[40%]">
                    <span className="text-gray-700 text-[9px] xs:text-[10px] sm:text-xs absolute top-[-18px] sm:top-[-20px] left-1/2 -translate-x-1/2">40%</span>
                    </div>
                    <div className="absolute bottom-[-20px] sm:bottom-[-25px] left-[73%] w-[12%] text-center text-gray-700 text-[9px] xs:text-[10px] sm:text-xs">Price</div>
                    
                  </div>
                </div>
                {/* Pie Chart for Market Opportunities */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-semibold mb-4 text-center">Market Opportunities</h4>
                   <div className="bg-gray-100 h-52 w-52 rounded-full mx-auto relative">
                      {/* Simulate Pie Chart */}
                      <div className="absolute top-0 left-0 w-full h-full rounded-full" style={{ background: 'conic-gradient(#007bff 0% 40%, #6610f2 40% 70%, #dc3545 70% 90%, #fd7e14 90% 100%)' }}>
                      </div>
                      <div className="absolute top-[5%] sm:top-[10%] right-[5%] sm:right-[10%] w-[80px] xs:w-[100px] text-[9px] xs:text-[10px] sm:text-xs text-gray-700 flex items-center justify-center">
                        <div className="w-2 h-2 xs:w-3 xs:h-3 rounded-full bg-blue-500 mr-1 xs:mr-2"></div>
                        Fintech 40%
                      </div>
                      <div className="absolute bottom-[5%] sm:bottom-[10%] left-[2%] sm:left-[5%] w-[80px] xs:w-[100px] text-[9px] xs:text-[10px] sm:text-xs text-gray-700 flex items-center justify-center">
                        <div className="w-2 h-2 xs:w-3 xs:h-3 rounded-full bg-purple-700 mr-1 xs:mr-2"></div>
                        Healthcare 30%
                      </div>
                      <div className="absolute top-[35%] sm:top-[40%] left-[-15%] sm:left-[-20%] w-[80px] xs:w-[100px] text-[9px] xs:text-[10px] sm:text-xs text-gray-700 flex items-center justify-center">
                        <div className="w-2 h-2 xs:w-3 xs:h-3 rounded-full bg-red-500 mr-1 xs:mr-2"></div>
                        EdTech 20%
                      </div>
                      <div className="absolute bottom-[10%] sm:bottom-[15%] right-[-10%] sm:right-[-10%] w-[80px] xs:w-[100px] text-[9px] xs:text-[10px] sm:text-xs text-gray-700 flex items-center justify-center">
                        <div className="w-2 h-2 xs:w-3 xs:h-3 rounded-full bg-yellow-500 mr-1 xs:mr-2"></div>
                        Others 10%
                      </div>
                    </div>

                </div>
                {/* Line Graph for Demand Trends */}
                <div className="bg-white p-4 rounded-lg shadow">
                  <h4 className="font-semibold mb-2">Demand Trends</h4>
                   <div className="bg-gray-100 h-32 relative overflow-hidden">
                       {/* Grid lines */}
                     <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gray-300"></div>
                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-300"></div>
                    <div className="absolute top-3/4 left-0 w-full h-[1px] bg-gray-300"></div>
                    <div className="absolute top-0 left-[20%] h-full w-[1px] bg-gray-300"></div>
                    <div className="absolute top-0 left-[40%] h-full w-[1px] bg-gray-300"></div>
                    <div className="absolute top-0 left-[60%] h-full w-[1px] bg-gray-300"></div>
                    <div className="absolute top-0 left-[80%] h-full w-[1px] bg-gray-300"></div>
                    <div className="absolute top-0 left-[100%] h-full w-[1px] bg-gray-300"></div>
                    {/* Simulate Line Chart with more points - red-500 */}
                    <div className="absolute bottom-[25%] left-0 w-2 h-2 bg-green-500 rounded-full"></div> {/* Point 1 */}
                    <div className="absolute bottom-[50%] left-[10%] w-2 h-2 bg-green-500 rounded-full"></div> {/* Point 2 */}
                    <div className="absolute bottom-[75%] left-[20%] w-2 h-2 bg-green-500 rounded-full"></div> {/* Point 3 */}
                    <div className="absolute bottom-[95%] left-[40%] w-2 h-2 bg-green-500 rounded-full"></div> {/* Point 4 */}
                    <div className="absolute bottom-[75%] left-[60%] w-2 h-2 bg-green-500 rounded-full"></div> {/* Point 5 */}
                    <div className="absolute bottom-[50%] left-[80%] w-2 h-2 bg-green-500 rounded-full"></div> {/* Point 6 */}
                    <div className="absolute bottom-[30%] left-[100%] w-2 h-2 bg-green-500 rounded-full"></div> {/* Point 7 */}
                    {/* Connecting lines */}
                    <div className="absolute bottom-[25%] left-0 w-[10%] h-0.5 bg-green-300 transform origin-left" style={{ transform: 'rotate(-45deg)' }}></div>{/* Line 1-2 */}
                    <div className="absolute bottom-[50%] left-[10%] w-[10%] h-0.5 bg-green-300 transform origin-left" style={{ transform: 'rotate(-45deg)' }}></div> {/* Line 2-3 */}
                    <div className="absolute bottom-[75%] left-[20%] w-[20%] h-0.5 bg-green-300 transform origin-left" style={{ transform: 'rotate(-30deg)' }}></div> {/* Line 3-4 */}
                    <div className="absolute top-[5%] left-[40%] w-[20%] h-0.5 bg-green-300 transform origin-left" style={{ transform: 'rotate(30deg)' }}></div>{/* Line 4-5 */}
                    <div className="absolute bottom-[75%] left-[60%] w-[20%] h-0.5 bg-green-300 transform origin-left" style={{ transform: 'rotate(30deg)' }}></div> {/* Line 5-6 */}
                    <div className="absolute bottom-[50%] left-[80%] w-[20%] h-0.5 bg-green-300 transform origin-left" style={{ transform: 'rotate(15deg)' }}></div> {/* Line 6-7 */}
                  </div>
                </div>
              </div>


              <ul className='text-gray-700'>
                <li>- Demand Trends: The market is showing increasing demand for AI-driven product solutions.</li>
                <li>- User Preferences: Users are prioritizing user-friendly interfaces and personalized experiences.</li>
                <li>- Competitive Analysis: Competitors are focusing on cloud-based solutions and data analytics.</li>
                <li>- Emerging Technologies: There's a rising interest in blockchain integration for security and transparency.</li>
                <li>- Market Opportunities: Significant opportunities exist in the fintech and healthcare sectors for innovative AI applications.</li>
              </ul>
            </div>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-semibold text-purple-600 flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Target className="w-6 h-6" />
              </motion.div>
              Product Skills
            </h3>
            <ul className="space-y-3 text-gray-700">
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Product Strategy</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• User Research </motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Roadmap Planning </motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Agile Project Management </motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Data Analysis </motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Stakeholder Management </motion.li>
            </ul>
          </motion.div>
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl font-semibold text-blue-600 flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Server className="w-6 h-6" />
              </motion.div>
              Cloud Journey
            </h3>
            <ul className="space-y-3 text-gray-700">
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• AWS Fundamentals</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Docker & Containers</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• CI/CD Pipelines</motion.li>
              <motion.li whileHover={{ x: 10 }} transition={{ duration: 0.2 }}>• Infrastructure as Code</motion.li>
            </ul>
          </motion.div>
          </div>
    </div>
  )
}

export default About;


