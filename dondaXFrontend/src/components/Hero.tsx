import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import heroImage from "../assets/motorbike.webp";

// Static motorcycle data
const motorcycles = [
  {
    id: 1,
    name: "GN MODEL",
    description: "Experience the future of electrical mobility with cutting edge technology",
    image: heroImage,
    price: "$12,999"
  },
  {
    id: 2,
    name: "SPORT MODEL",
    description: "High-performance electric motorcycle for the ultimate riding experience",
    image: heroImage,
    price: "$15,999"
  },
  {
    id: 3,
    name: "URBAN MODEL",
    description: "Perfect for city commuting with extended battery life and comfort",
    image: heroImage,
    price: "$10,999"
  },
  {
    id: 4,
    name: "ADVENTURE MODEL",
    description: "Built for long-distance travel with rugged design and durability",
    image: heroImage,
    price: "$18,999"
  }
];

const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % motorcycles.length);
    }, 4000); // 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Manual navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? motorcycles.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % motorcycles.length);
  };

  const currentMotorcycle = motorcycles[currentIndex];

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center bg-[#f8fbff] dark:bg-black transition-colors duration-300 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-7xl w-full mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div 
            className="space-y-4 sm:space-y-6 text-center lg:text-left"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.8, 
              ease: "easeOut",
              staggerChildren: 0.2
            }}
          >
            <motion.div 
              className="space-y-2 sm:space-y-3"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-black dark:text-white leading-tight">
                Ride Electric
              </h1>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                <span className="text-black dark:text-white">Ride </span>
                <span className="text-green">DondaX</span>
              </h2>
            </motion.div>
            <motion.p 
              className="tracking-widest uppercase text-green font-semibold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
            >
              Discover the future of urban mobility
            </motion.p>
            <motion.p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg md:text-xl max-w-xl">
              Experience the perfect blend of cutting-edge technology, sustainable power, and unmatched performance with our revolutionary electric motorcycle lineup.
            </motion.p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <motion.button 
                className="bg-green hover:bg-green/90 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300 text-base shadow-md shadow-green-100/60 border-2 border-green"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Motorcycles
              </motion.button>
              <button className="bg-white border-2 border-green text-green font-bold py-3 px-8 rounded-full transition-colors duration-300 text-base shadow-md hover:bg-green/10">
                Schedule Test Ride
              </button>
            </div>
          </motion.div>

          {/* Right Column - Product Card */}
          <motion.div 
            className="relative mt-8 lg:mt-0"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 1.5, 
              ease: "easeOut",
              delay: 0.3
            }}
          >
            {/* Left Arrow - Hidden on mobile, visible on larger screens */}
            <button 
              onClick={goToPrevious}
              className="hidden sm:flex absolute left-[-40px] sm:left-[-50px] lg:left-[-60px] top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-black rounded-full items-center justify-center transition-colors duration-300 hover:bg-gray-300 dark:hover:bg-gray-800 shadow-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Product Card */}
            <div className="bg-white dark:bg-black rounded-3xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border-0.2 border-green dark:border-green min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] overflow-hidden shadow-[0_8px_40px_0_rgba(34,255,0,0.10)] dark:shadow-none">
              <motion.div 
                key={currentIndex}
                className="space-y-3 sm:space-y-4 justify-center"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ 
                  duration: 0.5, 
                  ease: "easeInOut"
                }}
              >
                <motion.img 
                  src={currentMotorcycle.image} 
                  alt={`${currentMotorcycle.name} Electric Motorcycle`} 
                  className="w-full h-40 sm:h-48 md:h-52 lg:h-60 object-cover rounded-xl border-0.2 border-green dark:border-green mx-auto bg-[#f8fbff]"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                <motion.div 
                  className="space-y-2 sm:space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
                >
                  <h3 className="text-green font-extrabold text-lg sm:text-xl md:text-2xl mt-4 sm:mt-6 lg:mt-10 uppercase">{currentMotorcycle.name}</h3>
                  <p className="text-gray-500 dark:text-gray-300 font-normal text-xs sm:text-sm md:text-base">
                    {currentMotorcycle.description}
                  </p>
                  <motion.div 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: "easeInOut" }}
                  >
                    <span className="text-green font-extrabold text-lg sm:text-xl">{currentMotorcycle.price}</span>
                    <motion.button 
                      className="bg-green hover:bg-green/90 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 text-xs sm:text-sm shadow-md shadow-green-100/60 border-2 border-green"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ORDER NOW
                    </motion.button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
            
            {/* Right Arrow - Hidden on mobile, visible on larger screens */}
            <button 
              onClick={goToNext}
              className="hidden sm:flex absolute right-[-40px] sm:right-[-50px] lg:right-[-60px] top-1/2 transform -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-black rounded-full items-center justify-center transition-colors duration-300 hover:bg-gray-300 dark:hover:bg-gray-800 shadow-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          <motion.div 
            className="w-6 h-10 border-2 border-green rounded-full flex justify-center"
            animate={{ y: [0, 10, 0] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-1 h-3 bg-green rounded-full mt-2 animate-pulse" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

