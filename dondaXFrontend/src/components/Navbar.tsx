import React, { useState } from "react";
import { Link } from "react-router-dom";
import ToggleDarkModeButton from "./ToggleDarkModeButton";

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/products", label: "Products" },
    { to: "/gnhub", label: "GNHub" },
    { to: "/order", label: "Order" },
    { to: "/contact", label: "Contact" },
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
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-300 hover:text-green px-2 sm:px-3 lg:px-4 py-2 rounded-md text-sm lg:text-base font-medium transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
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
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className="block text-gray-300 hover:text-green px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 hover:bg-gray-600 dark:hover:bg-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;