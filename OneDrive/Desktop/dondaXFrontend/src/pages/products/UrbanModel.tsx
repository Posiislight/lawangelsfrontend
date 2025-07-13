import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const UrbanModel: React.FC = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  const specs = [
    { label: "Range", value: "150 miles", icon: "🏙️" },
    { label: "Top Speed", value: "65 mph", icon: "⚡" },
    { label: "Power", value: "10 kW", icon: "🔋" },
    { label: "Battery", value: "48V 40Ah", icon: "⚡" },
    { label: "Charging Time", value: "3-4 hours", icon: "🔌" },
    { label: "Weight", value: "140 kg", icon: "⚖️" },
  ];

  const features = [
    "Comfort Seat Design",
    "Storage Compartment",
    "City Mode Navigation",
    "Easy Parking System",
    "Weather Protection",
    "Low Noise Operation",
    "Compact Design",
    "Affordable Maintenance",
  ];

  const colors = [
    { name: "City Gray", hex: "#808080" },
    { name: "Ocean Blue", hex: "#0066cc" },
    { name: "Mint Green", hex: "#98FB98" },
    { name: "Warm White", hex: "#F5F5DC" },
  ];

  return (
    <div className="mt-12 min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-black dark:text-white">URBAN </span>
            <span className="text-green">MODEL</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Perfect for city commuting with extended battery life and comfort. 
            Designed for daily urban transportation with practical features and ease of use.
          </p>
          <div className="text-3xl font-bold text-green mt-4">
            $10,999
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Image and Colors */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            {/* Main Image */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-lg">
              <img
                src="/src/assets/motorbike.webp"
                alt="Urban Model Electric Motorcycle"
                className="w-full h-96 object-cover rounded-xl"
              />
            </div>

            {/* Color Options */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4">Available Colors</h3>
              <div className="grid grid-cols-2 gap-4">
                {colors.map((color) => (
                  <div key={color.name} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <span className="font-medium">{color.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Specs and Features */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            {/* Specifications */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-6">Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {specs.map((spec, index) => (
                  <motion.div
                    key={spec.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <span className="text-2xl">{spec.icon}</span>
                    <div>
                      <div className="font-medium">{spec.label}</div>
                      <div className="text-green font-semibold">{spec.value}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-6">Key Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-2 h-2 bg-green rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">About the Urban Model</h3>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  The Urban Model is specifically designed for city dwellers who need reliable, 
                  efficient transportation for their daily commute. With a 150-mile range and 
                  compact design, it's perfect for navigating busy urban streets and tight parking spaces.
                </p>
                <p>
                  The comfortable seat and ergonomic design ensure a pleasant riding experience 
                  even during long commutes. The built-in storage compartment provides space for 
                  essentials like a laptop, lunch, or shopping bags.
                </p>
                <p>
                  City Mode navigation helps you find the fastest routes through traffic, while 
                  the Easy Parking System makes finding and securing parking spots a breeze. 
                  The low noise operation ensures you won't disturb your neighbors during early 
                  morning or late night rides.
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/order"
                className="flex-1 bg-green text-black font-bold py-4 px-8 rounded-lg text-center hover:bg-green/90 transition-colors duration-300 shadow-lg"
              >
                Order Now
              </Link>
              <button className="flex-1 border-2 border-green text-green font-bold py-4 px-8 rounded-lg hover:bg-green hover:text-black transition-colors duration-300">
                Schedule Test Ride
              </button>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1.0 }}
          className="mt-16"
        >
          <h3 className="text-2xl font-bold mb-8 text-center">Explore Other Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/products/gn-model"
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
            >
              <h4 className="text-xl font-bold mb-2 group-hover:text-green transition-colors">GN Model</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Urban electric motorcycle</p>
              <div className="text-green font-bold">$12,999</div>
            </Link>
            <Link
              to="/products/sport-model"
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
            >
              <h4 className="text-xl font-bold mb-2 group-hover:text-green transition-colors">Sport Model</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">High-performance electric</p>
              <div className="text-green font-bold">$15,999</div>
            </Link>
            <Link
              to="/products/adventure-model"
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
            >
              <h4 className="text-xl font-bold mb-2 group-hover:text-green transition-colors">Adventure Model</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Built for long-distance travel</p>
              <div className="text-green font-bold">$18,999</div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UrbanModel; 