import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ToggleDarkModeButton from "./ToggleDarkModeButton";
import { useTheme } from "../context/ThemeContext";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const productsDropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsProductsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target as Node)) {
        setIsProductsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    // If we're not on the home page, navigate there first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // If we're already on home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    closeMenu();
  };

  const navLinks = [
    { to: "hero", label: "Home", isLink: false },
    { to: "about", label: "About", isLink: false },
    { to: "/blog", label: "GNHub", isLink: true },
    { to: "/order", label: "Order", isLink: true },
    { to: "contact", label: "Contact", isLink: false },
  ];

  const productLinks = [
    { to: "/products/gn-model", label: "GN Model", description: "Urban Electric Motorcycle" },
    { to: "/products/sport-model", label: "Sport Model", description: "High-Performance Electric" },
    { to: "/products/urban-model", label: "Urban Model", description: "City Commuter Electric" },
    { to: "/products/adventure-model", label: "Adventure Model", description: "Long-Distance Electric" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-800 shadow-md dark:bg-black transition-colors duration-300 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-thin" style={{ color: "#77ff00", fontFamily: "'Inria Sans', sans-serif" }}>
            DondaX
          </h1>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              link.isLink ? (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-gray-300 hover:text-green px-2 sm:px-3 lg:px-4 py-2 rounded-md text-sm lg:text-base font-medium transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.to}
                  onClick={() => scrollToSection(link.to)}
                  className="text-gray-300 hover:text-green px-2 sm:px-3 lg:px-4 py-2 rounded-md text-sm lg:text-base font-medium transition-colors duration-300"
                >
                  {link.label}
                </button>
              )
            ))}
            
            {/* Products Dropdown */}
            <div className="relative" ref={productsDropdownRef}>
              <button
                onClick={() => setIsProductsDropdownOpen(!isProductsDropdownOpen)}
                className="text-gray-300 hover:text-green px-2 sm:px-3 lg:px-4 py-2 rounded-md text-sm lg:text-base font-medium transition-colors duration-300 flex items-center"
              >
                Products
                <svg
                  className={`ml-1 w-4 h-4 transition-transform duration-200 ${
                    isProductsDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isProductsDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-2">
                    {productLinks.map((product) => (
                      <Link
                        key={product.to}
                        to={product.to}
                        onClick={() => setIsProductsDropdownOpen(false)}
                        className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <div className="font-medium text-sm">{product.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{product.description}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <ToggleDarkModeButton darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ToggleDarkModeButton darkMode={darkMode} setDarkMode={setDarkMode} />
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-green p-2 rounded-md transition-colors duration-300"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-700 dark:bg-gray-900 rounded-lg mt-3 shadow-lg">
            {navLinks.map((link) => (
              link.isLink ? (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className="block text-gray-300 hover:text-green px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 hover:bg-gray-600 dark:hover:bg-gray-800"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.to}
                  onClick={() => scrollToSection(link.to)}
                  className="block w-full text-left text-gray-300 hover:text-green px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 hover:bg-gray-600 dark:hover:bg-gray-800"
                >
                  {link.label}
                </button>
              )
            ))}
            
            {/* Mobile Products Section */}
            <div className="border-t border-gray-600 dark:border-gray-700 pt-2 mt-2">
              <div className="text-gray-400 text-xs font-medium px-3 py-1">Products</div>
              {productLinks.map((product) => (
                <Link
                  key={product.to}
                  to={product.to}
                  onClick={closeMenu}
                  className="block text-gray-300 hover:text-green px-6 py-2 rounded-md text-sm font-medium transition-colors duration-300 hover:bg-gray-600 dark:hover:bg-gray-800"
                >
                  {product.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;