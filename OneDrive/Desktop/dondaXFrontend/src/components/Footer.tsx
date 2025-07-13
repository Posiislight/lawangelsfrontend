import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#263236] text-gray-100 pt-12 pb-4 px-4">
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:justify-between gap-10 md:gap-0">
        {/* Brand/Description/Socials */}
        <div className="flex-1 min-w-[200px] flex flex-col gap-4">
          <div className="text-2xl font-bold text-green mb-1">DONDA X</div>
          <p className="text-sm max-w-xs">
            Pioneering the future of electric mobility with premium motorcycles that combine cutting-edge technology, sustainable innovation, and uncompromising performance.
          </p>
          <div className="flex gap-4 mt-2">
            <a href="#" className="hover:text-green transition-colors"><FaFacebookF /></a>
            <a href="#" className="hover:text-green transition-colors"><FaInstagram /></a>
            <a href="#" className="hover:text-green transition-colors"><FaTwitter /></a>
            <a href="#" className="hover:text-green transition-colors"><FaLinkedinIn /></a>
          </div>
        </div>
        {/* Quick Links */}
        <div className="flex-1 min-w-[150px]">
          <div className="font-semibold mb-2">Quick Links</div>
          <ul className="space-y-1 text-sm">
            <li><a href="#" className="hover:text-green transition-colors">Home</a></li>
            <li><a href="#" className="hover:text-green transition-colors">Gallery</a></li>
            <li><a href="#" className="hover:text-green transition-colors">Products</a></li>
            <li><a href="#" className="hover:text-green transition-colors">Contact</a></li>
          </ul>
        </div>
        {/* Contact Info */}
        <div className="flex-1 min-w-[180px]">
          <div className="font-semibold mb-2">Contact</div>
          <div className="text-sm space-y-1">
            <div>123 Electric Avenue</div>
            <div>Tech District, TC</div>
            <div>12345</div>
            <div>United States</div>
            <a href="mailto:contact@dondax.com" className="block text-green hover:underline mt-2">contact@dondax.com</a>
            <div>0916479500</div>
          </div>
        </div>
        {/* Newsletter/Subscribe */}
        <div className="flex-1 min-w-[220px]">
          <div className="font-semibold mb-2">Stay Updated</div>
          <p className="text-sm mb-2">Subscribe to get the latest news, updates, and exclusive offers.</p>
          <form className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="rounded-md px-3 py-2 bg-[#3a4747] text-gray-100 border border-gray-400 focus:outline-none focus:ring-2 focus:ring-green placeholder-gray-300 text-sm"
            />
            <button
              type="submit"
              className="bg-green text-black font-semibold rounded-md py-2 text-sm hover:bg-green/90 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <hr className="my-8 border-gray-400" />
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:justify-between items-center gap-4 text-xs text-gray-300">
        <div>© 2024 DONDA X. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-green transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-green transition-colors">Terms of Services</a>
          <a href="#" className="hover:text-green transition-colors">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;