import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Motorcycle data
const motorcycles = [
  {
    id: 1,
    name: "GN MODEL",
    description: "Experience the future of electrical mobility with cutting edge technology",
    basePrice: 12999,
    image: "/src/assets/motorbike.webp",
    specs: {
      range: "200 miles",
      topSpeed: "85 mph",
      power: "15 kW",
      battery: "72V 50Ah"
    },
    colors: ["Matte Black", "Electric Blue", "Forest Green", "Sunset Orange"],
    features: ["Smart Navigation", "Regenerative Braking", "LED Lighting", "Mobile App"]
  },
  {
    id: 2,
    name: "SPORT MODEL",
    description: "High-performance electric motorcycle for the ultimate riding experience",
    basePrice: 15999,
    image: "/src/assets/motorbike.webp",
    specs: {
      range: "180 miles",
      topSpeed: "120 mph",
      power: "25 kW",
      battery: "72V 60Ah"
    },
    colors: ["Racing Red", "Carbon Black", "Neon Green", "Chrome Silver"],
    features: ["Sport Mode", "Advanced Suspension", "Racing Tires", "Performance Dashboard"]
  },
  {
    id: 3,
    name: "URBAN MODEL",
    description: "Perfect for city commuting with extended battery life and comfort",
    basePrice: 10999,
    image: "/src/assets/motorbike.webp",
    specs: {
      range: "150 miles",
      topSpeed: "65 mph",
      power: "10 kW",
      battery: "48V 40Ah"
    },
    colors: ["City Gray", "Ocean Blue", "Mint Green", "Warm White"],
    features: ["Comfort Seat", "Storage Compartment", "City Mode", "Easy Parking"]
  },
  {
    id: 4,
    name: "ADVENTURE MODEL",
    description: "Built for long-distance travel with rugged design and durability",
    basePrice: 18999,
    image: "/src/assets/motorbike.webp",
    specs: {
      range: "300 miles",
      topSpeed: "95 mph",
      power: "20 kW",
      battery: "96V 70Ah"
    },
    colors: ["Desert Tan", "Mountain Green", "Storm Gray", "Aurora Blue"],
    features: ["Off-road Capability", "Extended Range", "Rugged Design", "Adventure Gear"]
  }
];

// Additional features and their prices
const additionalFeatures = [
  { name: "Extended Warranty (3 years)", price: 999 },
  { name: "Premium Sound System", price: 599 },
  { name: "Custom Paint Job", price: 1299 },
  { name: "Performance Upgrade Kit", price: 2499 },
  { name: "Premium Leather Seat", price: 399 },
  { name: "Advanced Security System", price: 299 }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

const Order: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMotorcycle, setSelectedMotorcycle] = useState(motorcycles[0]);
  const [selectedColor, setSelectedColor] = useState(motorcycles[0].colors[0]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: ""
  });

  // Calculate total price
  const basePrice = selectedMotorcycle.basePrice;
  const featuresPrice = selectedFeatures.reduce((total, featureName) => {
    const feature = additionalFeatures.find(f => f.name === featureName);
    return total + (feature?.price || 0);
  }, 0);
  const totalPrice = basePrice + featuresPrice;

  const handleFeatureToggle = (featureName: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureName) 
        ? prev.filter(f => f !== featureName)
        : [...prev, featureName]
    );
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitOrder = () => {
    // Here you would typically send the order to your backend
    alert("Order submitted successfully! We'll contact you soon.");
    navigate("/");
  };

  return (
    <div className="mt-12 min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span className="text-black dark:text-white">Order Your </span>
            <span className="text-green">DondaX</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Customize and order your perfect electric motorcycle
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="flex justify-center mb-8"
        >
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep >= step 
                    ? "bg-green text-black" 
                    : "bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? "bg-green" : "bg-gray-300 dark:bg-gray-700"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold mb-6">Choose Your Model</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {motorcycles.map((motorcycle) => (
                    <motion.div
                      key={motorcycle.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        selectedMotorcycle.id === motorcycle.id
                          ? "border-green bg-green/10"
                          : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                      }`}
                      onClick={() => setSelectedMotorcycle(motorcycle)}
                    >
                      <img
                        src={motorcycle.image}
                        alt={motorcycle.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <h3 className="text-xl font-bold mb-2">{motorcycle.name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {motorcycle.description}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Range:</span>
                          <span className="font-semibold">{motorcycle.specs.range}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Top Speed:</span>
                          <span className="font-semibold">{motorcycle.specs.topSpeed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Power:</span>
                          <span className="font-semibold">{motorcycle.specs.power}</span>
                        </div>
                      </div>
                      <div className="mt-4 text-2xl font-bold text-green">
                        ${motorcycle.basePrice.toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold mb-6">Customize Your Motorcycle</h2>
                
                {/* Color Selection */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Choose Color</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedMotorcycle.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                          selectedColor === color
                            ? "border-green bg-green/10"
                            : "border-gray-300 dark:border-gray-600 hover:border-green/50"
                        }`}
                      >
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full bg-gray-400 mx-auto mb-2"></div>
                          <span className="text-sm font-medium">{color}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Features */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">Additional Features</h3>
                  <div className="space-y-3">
                    {additionalFeatures.map((feature) => (
                      <label key={feature.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature.name)}
                            onChange={() => handleFeatureToggle(feature.name)}
                            className="w-4 h-4 text-green border-gray-300 rounded focus:ring-green"
                          />
                          <span className="ml-3 font-medium">{feature.name}</span>
                        </div>
                        <span className="text-green font-semibold">+${feature.price.toLocaleString()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold mb-6">Customer Information</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">First Name</label>
                      <input
                        type="text"
                        value={customerInfo.firstName}
                        onChange={(e) => setCustomerInfo({...customerInfo, firstName: e.target.value})}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Last Name</label>
                      <input
                        type="text"
                        value={customerInfo.lastName}
                        onChange={(e) => setCustomerInfo({...customerInfo, lastName: e.target.value})}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Address</label>
                      <input
                        type="text"
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input
                        type="text"
                        value={customerInfo.city}
                        onChange={(e) => setCustomerInfo({...customerInfo, city: e.target.value})}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ZIP Code</label>
                      <input
                        type="text"
                        value={customerInfo.zipCode}
                        onChange={(e) => setCustomerInfo({...customerInfo, zipCode: e.target.value})}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-green focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 border-2 border-green text-green font-semibold rounded-lg hover:bg-green hover:text-black transition-colors duration-300"
                >
                  Previous
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 bg-green text-black font-semibold rounded-lg hover:bg-green/90 transition-colors duration-300 ml-auto"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmitOrder}
                  className="px-8 py-3 bg-green text-black font-semibold rounded-lg hover:bg-green/90 transition-colors duration-300 ml-auto"
                >
                  Place Order
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg sticky top-8">
              <h3 className="text-xl font-bold mb-4">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h4 className="font-semibold text-lg">{selectedMotorcycle.name}</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                    Color: {selectedColor}
                  </p>
                  <div className="text-2xl font-bold text-green">
                    ${selectedMotorcycle.basePrice.toLocaleString()}
                  </div>
                </div>

                {selectedFeatures.length > 0 && (
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h4 className="font-semibold mb-2">Additional Features</h4>
                    <div className="space-y-1">
                      {selectedFeatures.map((featureName) => {
                        const feature = additionalFeatures.find(f => f.name === featureName);
                        return (
                          <div key={featureName} className="flex justify-between text-sm">
                            <span>{featureName}</span>
                            <span className="text-green">+${feature?.price.toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-green">${totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Order;
