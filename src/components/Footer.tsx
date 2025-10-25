import manpicture from '../assets/omoooo.jpg';
import logo from '../assets/lawangelslogo.png';
import logotext from '../assets/logotext.png';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <>
      {/* Desktop/tablet styling */}
      <section className="hidden md:block text-white font-worksans z-0">
        <div className="w-full relative overflow-hidden">
          <motion.img
            src={manpicture}
            alt="hero"
            className="w-full h-64 md:h-80 lg:h-[650px] object-cover"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.8 }}
          />

          {/* Overlay text */}
          <div className="absolute inset-0 flex items-center justify-center lg:justify-end lg:items-start px-6 pt-[130px]">
            <div className="max-w-md text-center lg:text-right lg:mt-20 lg:mr-40">
              <span className="block font-medium text-[54px] sm:text-3xl lg:text-4xl text-[#2B3443] leading-tight">
                Ready to Start Your
                <span className="block">Legal Career?</span>
              </span>

              <span className="block mt-4 text-sm sm:text-base text-[#035C83] font-medium">
                Don’t leave your success to chance. Get structured guidance,
                comprehensive resources, and the confidence to ace your SQE exams
                on your first try.
              </span>
              <div className="flex justify-center lg:justify-end">
                <button className="bg-[#415DF0] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full mt-6 font-semibold hover:scale-105 duration-300">
                  Start your Journey
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-black text-white font-worksans rounded-t-[40px] w-full relative z-20 -mt-10 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
        <div className="max-w-7xl mx-auto px-6 py-16">
          {/* Logo and brand section */}
          <div className="flex items-center mb-12">
            <div className="flex items-center ">
              <div className="w-20 h-16 -ml-2">
                <img src={logo} alt="Law Angels logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <img src={logotext} alt="Law Angels" className="h-12 -ml-4 -mb-2" />
              </div>
            </div>
          </div>

          {/* Navigation columns */}
          <div className="grid grid-cols-5 gap-8 mb-12">
            {/* Path to Qualification */}
            <div>
              <h4 className="text-blue-300 font-semibold mb-4 text-lg">Path to Qualification</h4>
              <ul className="space-y-3 text-sm ">
                <li className="text-gray-300 hover:text-white cursor-pointer break-normal leading-snug">
                  How to qualify as a solicitor via the SQE Route
                </li>
                <li className="text-gray-300 hover:text-white cursor-pointer break-normal leading-snug">
                  Assessment timeline & key dates for SQE Assessment 2026
                </li>
                <li className="text-gray-300 hover:text-white cursor-pointer break-normal leading-snug">
                  Registering after you pass and admission
                </li>
                <li className="text-gray-300 hover:text-white cursor-pointer break-normal leading-snug">
                  Overseas lawyer pathways and exemptions
                </li>
              </ul>
            </div>

            {/* Prep Tools */}
            <div>
              <h4 className="text-blue-300 font-semibold mb-4 text-lg">Prep Tools</h4>
              <ul className="space-y-3 text-sm">
                <li className="text-gray-300 hover:text-white cursor-pointer">Pricing & features</li>
                <li className="text-gray-300 hover:text-white cursor-pointer">Sample MCQs</li>
              </ul>
            </div>

            {/* About Us */}
            <div>
              <h4 className="text-blue-300 font-semibold mb-4 text-lg">About Us</h4>
              <ul className="space-y-3 text-sm">
                <li className="text-gray-300 hover:text-white cursor-pointer">Our mission & values</li>
                <li className="text-gray-300 hover:text-white cursor-pointer">How we support you</li>
                <li className="text-gray-300 hover:text-white cursor-pointer">Testimonials & reviews</li>
              </ul>
            </div>

            {/* Get in Touch */}
            <div>
              <h4 className="text-blue-300 font-semibold mb-4 text-lg">Get in Touch</h4>
              <ul className="space-y-3 text-sm">
                <li className="text-gray-300 hover:text-white cursor-pointer">Call us</li>
                <li className="text-gray-300 hover:text-white cursor-pointer">Email support</li>
                <li className="text-gray-300 hover:text-white cursor-pointer">Press & collaborations</li>
              </ul>
            </div>

            {/* Stay Connected */}
            <div>
              <h4 className="text-blue-300 font-semibold mb-4 text-lg">Stay Connected</h4>
              <div className="flex gap-4">
                {/* Facebook */}
                <a href="#" className="text-white hover:text-blue-300 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 4.99 3.66 9.12 8.44 9.93v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22C18.34 21.19 22 17.06 22 12.07z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a href="#" className="text-white hover:text-blue-300 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="3.5" />
                    <path d="M17.5 6.5h.01" />
                  </svg>
                </a>

                {/* Twitter */}
                <a href="#" className="text-white hover:text-blue-300 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 4.5c-.7.3-1.5.5-2.3.6.8-.5 1.4-1.4 1.7-2.4-.7.4-1.6.6-2.5.9C19.2 2.9 18 2.5 16.7 2.5c-2.2 0-3.9 1.9-3.3 4.1-3-.2-5.6-1.6-7.3-3.8-1 1.7-.6 4.1 1 5.3-.6 0-1.3-.2-1.8-.5v.1c0 2 1.4 3.7 3.4 4.1-.6.2-1.2.2-1.8.1.5 1.6 2 2.8 3.8 2.8C8.7 17.8 6 18.6 3.2 18.1c2 1.2 4.4 1.9 6.9 1.9 8.3 0 12.9-6.9 12.9-12.9v-.6c.9-.6 1.6-1.4 2.2-2.3-.8.4-1.6.6-2.5.8z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a href="#" className="text-white hover:text-blue-300 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.08 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8h4.55v13H.22zM8.98 8h4.37v1.8h.1c.61-1.2 2.1-2.5 4.34-2.5 4.64 0 5.5 3.06 5.5 7.04V21h-4.55v-6.3c0-1.5 0-3.4-2.09-3.4-2.1 0-2.42 1.64-2.42 3.32V21H8.98V8z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Separator line */}
          <div className="border-t border-gray-700 mb-8"></div>

          {/* Bottom section */}
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div>
              Terms & condition &nbsp;&nbsp; Privacy &nbsp;&nbsp; Cookies &nbsp;&nbsp; Complaints policy
            </div>
            <div>2025 Law Angels. All right reserved.</div>
          </div>
        </div>
      </footer>
    </>
  );
}
