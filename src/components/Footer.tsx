import manpicture from '../assets/omoooo.jpg';
import logo from '../assets/lawangelslogo.png';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="text-white font-worksans">
      <div className="w-full relative overflow-hidden">
        <motion.img
          src={manpicture}
          alt="hero"
          className="w-full h-64 md:h-80 lg:h-96 object-cover"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.8 }}
        />

        {/* Overlay text - centered on small screens, right aligned on large */}
        <div className="absolute inset-0 flex items-center justify-center lg:justify-end lg:items-start px-6">
          <div className="max-w-md text-center lg:text-right lg:mt-20 lg:mr-40">
            <span className="block font-semibold text-2xl sm:text-3xl lg:text-4xl text-[#2B3443] leading-tight">
              Ready to Start Your
              <span className="block">Legal Career?</span>
            </span>

            <span className="block mt-4 text-sm sm:text-base text-[#035C83]">
              Don’t leave your success to chance. Get structured guidance,
              comprehensive resources, and the confidence to ace your SQE exams
              on your first try.
            </span>
            <div className="flex justify-center lg:justify-end">
              <button className="bg-[#0089FF] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full mt-6 font-semibold hover:scale-105 duration-300">
                Start your Journey
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer panel overlapping the image */}
      <div className="-mt-6 md:-mt-10 rounded-t-3xl bg-[#0b0b0b] relative z-20">
        <div className="max-w-7xl mx-auto px-6 pt-14 pb-12 sm:pt-16 sm:pb-16">
          <div className=" flex flex-col space-y-8">
            {/* Logo and brand section */}
            <div className=" flex items-center gap-4">
              <div className="w-32 h-32 flex justify-left -ml-10">
                <img src={logo} alt="Law Angels logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-[#2B9BD1] whitespace-nowrap">
                  Law Angels
                </h3>
                <p className="mt-2 text-sm text-gray-400 max-w-[260px]">Pathways, resources and expert guidance for your SQE journey.</p>
              </div>
            </div>

            {/* Navigation section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              <div>
              <h4 className="text-[#81D6FB] font-semibold mb-3">Path to Qualification</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>How to qualify as a solicitor via the SQE Route</li>
                <li>Assessment timeline & key dates for SQE</li>
                <li>Registering after you pass and admission</li>
                <li>Overseas lawyer pathways and exemptions</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#81D6FB] font-semibold mb-3">Prep Tools</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>Pricing & features</li>
                <li>Sample MCQs</li>
                <li>Mock assessments</li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#81D6FB] font-semibold mb-3">About Us</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>Our mission & values</li>
                <li>How we support you</li>
                <li>Testimonials & reviews</li>
              </ul>
            </div>

            <div className="flex flex-col">
              <h4 className="text-[#81D6FB] font-semibold mb-3">Get in Touch</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>Call us</li>
                <li>Email support</li>
                <li>Press & collaborations</li>
              </ul>
              </div>

              <div>
                <h4 className="text-[#81D6FB] font-semibold mb-3">Stay Connected</h4>
                <div className="flex gap-3">
                  <a href="#" aria-label="facebook" className="text-gray-300 hover:text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 4.99 3.66 9.12 8.44 9.93v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22C18.34 21.19 22 17.06 22 12.07z"/></svg>
                  </a>
                  <a href="#" aria-label="instagram" className="text-gray-300 hover:text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.5"/><path d="M17.5 6.5h.01"/></svg>
                  </a>
                  <a href="#" aria-label="twitter" className="text-gray-300 hover:text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 4.5c-.7.3-1.5.5-2.3.6.8-.5 1.4-1.4 1.7-2.4-.7.4-1.6.6-2.5.9C19.2 2.9 18 2.5 16.7 2.5c-2.2 0-3.9 1.9-3.3 4.1-3-.2-5.6-1.6-7.3-3.8-1 1.7-.6 4.1 1 5.3-.6 0-1.3-.2-1.8-.5v.1c0 2 1.4 3.7 3.4 4.1-.6.2-1.2.2-1.8.1.5 1.6 2 2.8 3.8 2.8C8.7 17.8 6 18.6 3.2 18.1c2 1.2 4.4 1.9 6.9 1.9 8.3 0 12.9-6.9 12.9-12.9v-.6c.9-.6 1.6-1.4 2.2-2.3-.8.4-1.6.6-2.5.8z"/></svg>
                  </a>
                  <a href="#" aria-label="linkedin" className="text-gray-300 hover:text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.08 1 2.5 1 4.98 2.12 4.98 3.5zM.22 8h4.55v13H.22zM8.98 8h4.37v1.8h.1c.61-1.2 2.1-2.5 4.34-2.5 4.64 0 5.5 3.06 5.5 7.04V21h-4.55v-6.3c0-1.5 0-3.4-2.09-3.4-2.1 0-2.42 1.64-2.42 3.32V21H8.98V8z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-400">Terms &amp; condition &nbsp;&nbsp; Privacy &nbsp;&nbsp; Cookies &nbsp;&nbsp; Complaints policy</div>
            <p className="text-sm text-gray-400">© 2025 Law Angels. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
