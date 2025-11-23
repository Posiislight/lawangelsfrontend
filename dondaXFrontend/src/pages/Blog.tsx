import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const blogPosts = [
  {
    id: 1,
    type: "Product Launch",
    featured: true,
    title: "DONDA X Model S: Revolutionary Electric Performance",
    description:
      "Introducing our flagship model with cutting-edge battery technology and unprecedented range capabilities.",
    date: "6/15/2024",
    image: "/src/assets/motorbike.webp",
    button: "Product Launch",
  },
  {
    id: 2,
    type: "Events",
    title: "New AI-Powered Smart Navigation System",
    description:
      "Experience the future of motorcycle navigation with our revolutionary AI system that learns your riding patterns",
    date: "6/8/2024",
    image: "/src/assets/motorbike.webp",
    button: "Read More",
  },
  {
    id: 3,
    type: "Company News",
    title: "DONDA X Reaches 10,000 Pre-Orders Milestone",
    description:
      "We're thrilled to announce that we've reached 10,000 pre-orders, marking a significant milestone in our journey.",
    date: "6/8/2024",
    image: "/src/assets/motorbike.webp",
    button: "Read More",
  },
];

const categories = [
  { label: "All", value: "All" },
  { label: "Product Launch", value: "Product Launch" },
  { label: "Events", value: "Events" },
  { label: "Company News", value: "Company News" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};

const Blog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const navigate = useNavigate();

  // Filter posts by category (except featured)
  const filteredPosts = blogPosts
    .filter((post) => !post.featured)
    .filter((post) => selectedCategory === "All" || post.type === selectedCategory);

  // Handler for arrow click
  const handleArrowClick = () => {
    navigate("/", { replace: false });
    setTimeout(() => {
      const heroSection = document.getElementById("hero");
      if (heroSection) {
        heroSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 300); // Delay to allow navigation
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white px-2 sm:px-4 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Blog & News Header */}
        <br/>
        <br/>
        <br/>
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2"
        >
          <button
            onClick={handleArrowClick}
            className="focus:outline-none"
            aria-label="Go to Home Hero Section"
            style={{ background: "none", border: "none", padding: 0, marginRight: 8 }}
          >
            <svg className="inline-block mr-1 text-green hover:scale-110 transition-transform duration-200" width="1em" height="1em" viewBox="0 0 24 24" fill="none">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="text-green text-2xl sm:text-3xl md:text-4xl font-bold flex items-center">
            BLOG
          </span>
          <span className="text-2xl sm:text-3xl md:text-4xl font-light">&amp; NEWS</span>
        </motion.div>
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          className="text-gray-500 dark:text-gray-300 mb-6 text-sm sm:text-base"
        >
          Stay updated with the latest from DONDA X
        </motion.div>
        {/* Filter Buttons */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.6 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-1 rounded-full font-medium text-xs sm:text-sm transition-colors duration-200
                ${selectedCategory === cat.value
                  ? "bg-green text-black"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white"}
              `}
            >
              {cat.label}
            </button>
          ))}
        </motion.div>
        {/* Featured Story */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="mb-10"
        >
          <div className="text-green text-base sm:text-lg font-semibold mb-2">Featured Story</div>
          <div className="bg-white dark:bg-[#2a363a] rounded-lg flex flex-col lg:flex-row overflow-hidden transition-shadow duration-300 hover:shadow-[0_0_32px_0_rgba(119,255,0,0.5)]">
            <img
              src={blogPosts[0].image}
              alt="Featured Story"
              className="w-full lg:w-1/2 h-48 sm:h-64 object-cover"
            />
            <div className="flex flex-col justify-between p-4 sm:p-6 lg:w-1/2">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-green text-black text-xs font-semibold px-3 py-1 rounded-full">Product Launch</span>
                  <span className="text-xs text-gray-700 dark:text-gray-200 font-semibold">Featured</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold mb-2 leading-tight">
                  {blogPosts[0].title}
                </div>
                <div className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
                  {blogPosts[0].description}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 mb-4">{blogPosts[0].date}</div>
              </div>
              <button className="bg-green text-black font-semibold px-4 py-2 rounded-full w-max text-xs sm:text-sm">
                Product Launch
              </button>
            </div>
          </div>
        </motion.div>
        {/* Other Stories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {filteredPosts.length === 0 ? (
            <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-12 text-lg">No stories found for this category.</div>
          ) : (
            filteredPosts.map((post, idx) => (
              <motion.div
                key={post.id}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.1 * idx }}
                className="group bg-white dark:bg-[#2a363a] rounded-lg overflow-hidden flex flex-col transition-shadow duration-300 hover:shadow-[0_0_32px_0_rgba(119,255,0,0.5)]"
              >
                <div className="overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-40 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-between p-4 sm:p-6 flex-1">
                  <div>
                    <span className="bg-green text-black text-xs font-semibold px-3 py-1 rounded-full mb-2 inline-block">
                      {post.type}
                    </span>
                    <div className="text-base sm:text-xl font-bold mb-2 leading-tight transition-colors duration-300 group-hover:text-green">
                      {post.title}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
                      {post.description}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 mb-4">{post.date}</div>
                  </div>
                  <a href="#" className="text-green font-semibold text-xs sm:text-sm hover:underline mt-auto">
                    {post.button}
                  </a>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Blog;
