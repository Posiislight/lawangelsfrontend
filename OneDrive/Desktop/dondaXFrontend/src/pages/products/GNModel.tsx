import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const GNModel: React.FC = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
  };

  const specs = [
    { label: "Range", value: "200 miles", icon: "🚗" },
    { label: "Top Speed", value: "85 mph", icon: "⚡" },
    { label: "Power", value: "15 kW", icon: "🔋" },
    { label: "Battery", value: "72V 50Ah", icon: "⚡" },
    { label: "Charging Time", value: "4-6 hours", icon: "🔌" },
    { label: "Weight", value: "180 kg", icon: "⚖️" },
  ];

  const features = [
    "Smart Navigation System",
    "Regenerative Braking",
    "LED Lighting Package",
    "Mobile App Integration",
    "Anti-theft System",
    "Weather-resistant Design",
    "Comfortable Riding Position",
    "Low Maintenance",
  ];

  const colors = [
    { name: "Matte Black", hex: "#1a1a1a" },
    { name: "Electric Blue", hex: "#0066cc" },
    { name: "Forest Green", hex: "#228B22" },
    { name: "Sunset Orange", hex: "#FF8C00" },
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
            <span className="text-black dark:text-white">GN </span>
            <span className="text-green">MODEL</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Experience the future of electrical mobility with cutting edge technology. 
            Perfect for urban commuting with extended range and smart features.
          </p>
          <div className="text-3xl font-bold text-green mt-4">
            $12,999
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
                alt="GN Model Electric Motorcycle"
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
              <h3 className="text-2xl font-bold mb-4">About the GN Model</h3>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  The GN Model represents the perfect balance of performance, efficiency, and style. 
                  Designed for urban environments, this electric motorcycle offers an impressive 
                  200-mile range on a single charge, making it ideal for daily commuting and weekend adventures.
                </p>
                <p>
                  Equipped with advanced smart navigation, regenerative braking, and seamless mobile app integration, 
                  the GN Model provides a connected riding experience that adapts to your lifestyle. 
                  The weather-resistant design ensures reliability in all conditions.
                </p>
                <p>
                  With its comfortable riding position and low maintenance requirements, the GN Model 
                  is the perfect choice for riders who want cutting-edge technology without compromising 
                  on practicality and ease of use.
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
              to="/products/sport-model"
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
            >
              <h4 className="text-xl font-bold mb-2 group-hover:text-green transition-colors">Sport Model</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">High-performance electric motorcycle</p>
              <div className="text-green font-bold">$15,999</div>
            </Link>
            <Link
              to="/products/urban-model"
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
            >
              <h4 className="text-xl font-bold mb-2 group-hover:text-green transition-colors">Urban Model</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Perfect for city commuting</p>
              <div className="text-green font-bold">$10,999</div>
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

export default GNModel; 