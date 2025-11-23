import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import heroImage from "../assets/motorbike.webp";

const features = [
  "Advanced lithium-ion battery technology",
  "Smart connectivity and IoT integration",
  "Sustainable manufacturing processes",
  "Local talent and innovation",
];

const About: React.FC = () => {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisible(true);
      else setVisible(false);
    }, { threshold: 0.1 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div id="about" className="min-h-screen w-full flex flex-col items-center justify-center px-2 sm:px-4 py-8 bg-[#f8fbff] dark:bg-black transition-colors duration-300">
      <div
        ref={ref}
        className={`w-full max-w-7xl transition-all duration-700 ease-out flex flex-col gap-8 
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
        style={{ willChange: 'opacity, transform' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-2 mt-8">
          <div className="flex items-center gap-2">
            
            <motion.h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-black dark:text-white text-center tracking-wide">
              ABOUT <span className="text-green font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl ml-2">DONDAX</span>
            </motion.h1>
          </div>
          <p className=" text-lg text-center  text-gray-700 dark:text-gray-200 max-w-4xl mt-2">
            Pioneering the future of sustainable urban mobility through innovative electric motorcycle technology, designed and manufactured with pride in Nigeria.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch w-full">
          <div className="bg-white dark:bg-black border-2 border-green rounded-2xl p-10 shadow-[0_8px_40px_0_rgba(34,255,0,0.10)] dark:shadow-none dark:border-green flex flex-col items-center h-full">
            <h2 className="text-green text-2xl md:text-3xl font-bold mb-4 text-center">Our Mission</h2>
            <p className="text-gray-700 dark:text-white text-center text-lg md:text-xl font-light">
              To revolutionize urban transportation in Africa by providing cutting-edge, eco-friendly electric motorcycles that combine performance, sustainability, and affordability. We're committed to reducing carbon emissions while empowering communities through innovative mobility solutions.
            </p>
          </div>
          <div className="bg-white dark:bg-black border-2 border-green rounded-2xl p-10 shadow-[0_8px_40px_0_rgba(34,255,0,0.10)] dark:shadow-none dark:border-green flex flex-col items-center h-full">
            <h2 className="text-green text-2xl md:text-3xl font-bold mb-4 text-center">Our Vision</h2>
            <p className="text-gray-700 dark:text-white text-center text-lg md:text-xl font-light">
              To revolutionize urban transportation in Africa by providing cutting-edge, eco-friendly electric motorcycles that combine performance, sustainability, and affordability. We're committed to reducing carbon emissions while empowering communities through innovative mobility solutions.
            </p>
          </div>
        </div>

        {/* Building the Future */}
        <h3 className="text-4xl font-light text-black dark:text-white text-left mb-2 lg:mb-2 lg:mt-8">
          Building the <span className="text-green font-bold">Future</span>
        </h3>
        <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full mt-0">
          <div className="flex-1 flex flex-col gap-4">
            <ul className="flex flex-col gap-11 mt-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-gray-700 dark:text-white text-lg">
                  <span className="w-3 h-3 rounded-full bg-green inline-block"></span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-center items-center h-full">
            <div className="bg-white dark:bg-black border-0.2 border-green rounded-xl shadow-[0_8px_40px_0_rgba(34,255,0,0.10)] dark:shadow-none p-2 flex items-center justify-center h-72 w-full">
              <img src={heroImage} alt="Electric Motorcycle" className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>
            </div>
            
        {/* Call to Action */}
        <div className="flex flex-col items-center gap-6 mt-8">
          <h4 className="text-xl sm:text-2xl font-semibold text-center text-black dark:text-white">
            Ready to Join the <span className="text-green">Electric</span> Revolution ?
          </h4>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-green hover:bg-green/90 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300 text-base shadow-md shadow-green-100/60 border-2 border-green">
              Explore products
            </button>
            <button className="bg-white dark:bg-black border-2 border-green text-green font-bold py-3 px-8 rounded-full transition-colors duration-300 text-base shadow-md hover:bg-green/10">
              Contact us
            </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default About;