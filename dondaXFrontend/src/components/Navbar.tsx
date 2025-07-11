import React from "react";
import { Link } from "react-router-dom";
import ToggleDarkModeButton from "./ToggleDarkModeButton";

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-black shadow-md dark:bg-black transition-colors duration-300 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-thin" style={{ color: "#77ff00", fontFamily: "'Inria Sans', sans-serif" }}>DondaX</h1>
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-green px-4 py-2 rounded-md text-base font-medium transition-colors duration-300">Home</Link>
            <Link to="/about" className="text-gray-300 hover:text-green px-4 py-2 rounded-md text-base font-medium transition-colors duration-300">About</Link>
            <Link to="/products" className="text-gray-300 hover:text-green px-4 py-2 rounded-md text-base font-medium transition-colors duration-300">Products</Link>
            <Link to="/gnhub" className="text-gray-300 hover:text-green px-4 py-2 rounded-md text-base font-medium transition-colors duration-300">GNHub</Link>
            <Link to="/order" className="text-gray-300 hover:text-green px-4 py-2 rounded-md text-base font-medium transition-colors duration-300">Order</Link>
            <Link to="/contact" className="text-gray-300 hover:text-green px-4 py-2 rounded-md text-base font-medium transition-colors duration-300">Contact</Link>
            <ToggleDarkModeButton darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;