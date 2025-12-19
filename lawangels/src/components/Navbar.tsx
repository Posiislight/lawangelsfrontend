import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/lawangelslogo.png';
import logotext from '../assets/logotext.png';
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-4 left-0 right-0 z-40 font-worksans">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between rounded-full bg-[#1A1D3E] text-white shadow-lg ring-1 ring-white/10 px-4 h-[56px]">
          {/* Logo */}
          <Link to="/" className="flex items-center " onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={logo} alt="logo" className='w-14' />
          <img src={logotext} alt="logo" className='w-[93px] h-[20px] mt-2 -mx-2' />
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex gap-x-8">
            {/* About Us Dropdown */}
            <li className="relative group">
              <span className="text-sm text-white/80 group-hover:text-[#0089FF] transition-colors cursor-default">About Us</span>
              <div className='absolute top-[40px] left-0 bg-white/80 backdrop-blur-sm rounded-xl mt-5 shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 z-50 p-4'>
                <div className='flex flex-col py-2 space-y-2 min-w-[250px]'>
                  <a href="/about-us/mission" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded">Our Mission</a>
                  <a href="/about-us/how-we-support" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded">How We Support</a>
                  <a href="/about-us/testimonials" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded">Testimonials & reviews</a>
                </div>
              </div>
            </li>

            {/* Blog Dropdown with Path to Qualification as subheading */}
            <li className="relative group">
              <span className="text-sm text-white/80 group-hover:text-[#0089FF] transition-colors cursor-default">Blog</span>
              <div className='absolute top-[40px] left-0 bg-white/80 backdrop-blur-sm rounded-xl mt-5 shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 z-50 p-4'>
                <div className='flex flex-col py-2 space-y-2 min-w-[350px]'>
                  <p className='text-base text-[#1A1D3E] font-semibold px-2'>Path to Qualification</p>
                  <a href="/path-to-qualification/sqe-route" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded ml-2">How to qualify via the SQE Route</a>
                  <a href="/path-to-qualification/assessment-dates" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded ml-2">Assessment Dates for SQE 2026</a>
                  <a href="/path-to-qualification/registration" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded ml-2">Registering & Admission</a>
                  <a href="/path-to-qualification/overseas-pathways" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded ml-2">Overseas Lawyer Pathways</a>
                </div>
              </div>
            </li>

            {/* Prep Tools Dropdown */}
            <li className="relative group">
              <span className="text-sm text-white/80 group-hover:text-[#0089FF] transition-colors cursor-default">Prep Tools</span>
              <div className='absolute top-[40px] left-0 bg-white/80 backdrop-blur-sm rounded-xl mt-5 shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 z-50 p-4'>
                <div className='flex flex-col py-2 space-y-2 min-w-[250px]'>
                  <a href="/prep-tools/pricing" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded">Pricing & features</a>
                  <a href="/prep-tools/sample-mcqs" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded">Sample MCQs</a>
                </div>
              </div>
            </li>

            {/* Get in Touch Dropdown */}
            <li className="relative group">
              <span className="text-sm text-white/80 group-hover:text-[#0089FF] transition-colors cursor-default">Get in Touch</span>
              <div className='absolute top-[40px] left-0 bg-white/80 backdrop-blur-sm rounded-xl mt-5 shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 z-50 p-4'>
                <div className='flex flex-col py-2 space-y-2 min-w-[250px]'>
                  <a href="/contact/call-us" className="text-sm text-gray-700 hover:bg-gray-100 py-1 px-2 rounded">Contact Us</a>
                </div>
              </div>
            </li>
          </ul>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-x-3">
            <Link to="/login" className="px-4 py-2 rounded-full text-sm bg-[#1A1D3E] text-white/80 hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-4 py-2 rounded-full bg-sky-400 text-white text-sm hover:bg-sky-500 transition-colors">
              Get started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              type="button"
              className="p-2 hover:bg-white/10 rounded-md transition-colors bg-[#1A1D3E] text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open main menu'}
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open main menu'}</span>

              {!mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-slate-900 px-6 py-6 sm:max-w-sm text-white">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <img src={logo} alt="LawAngels" className="h-10 w-14 object-contain" />
                </Link>

                {/* <-- Updated close button: use text-sky-400 so SVG (currentColor) isn't white --> */}
                <button
                  type="button"
                  className="p-2 hover:bg-white/10 rounded-md transition-colors text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <span className="sr-only">Close menu</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-6 flow-root">
                <div className="space-y-6 py-6">
                  {/* About Us Section */}
                  <div className="space-y-2">
                    <p className="px-3 text-base font-semibold text-sky-400">About Us</p>
                    <div className="space-y-1">
                      <a href="/about-us/mission" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Our Mission</a>
                      <a href="/about-us/how-we-support" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">How We Support</a>
                      <a href="/about-us/testimonials" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Testimonials & reviews</a>
                    </div>
                  </div>

                  {/* Path to Qualification Section */}
                  <div className="space-y-2">
                    <p className="px-3 text-base font-semibold text-sky-400">Path to Qualification</p>
                    <div className="space-y-1">
                      <a href="/path-to-qualification/sqe-route" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">How to qualify as a solicitor via the SQE Route</a>
                      <a href="/path-to-qualification/assessment-dates" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Assessment time & key dates for SQE Assessment 2026</a>
                      <a href="/path-to-qualification/registration" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Registering after you pass and admission</a>
                      <a href="/path-to-qualification/overseas-pathways" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Overseas lawyer pathways and exemptions</a>
                    </div>
                  </div>

                  {/* Prep Tools Section */}
                  <div className="space-y-2">
                    <p className="px-3 text-base font-semibold text-sky-400">Prep Tools</p>
                    <div className="space-y-1">
                      <a href="/prep-tools/pricing" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Pricing & features</a>
                      <a href="/prep-tools/sample-mcqs" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Sample MCQs</a>
                    </div>
                  </div>

                  {/* Get in Touch Section */}
                  <div className="space-y-2">
                    <p className="px-3 text-base font-semibold text-sky-400">Get in Touch</p>
                    <div className="space-y-1">
                      <a href="/contact/call-us" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Call us</a>
                      <a href="/contact/support" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Email support</a>
                      <a href="/contact/press" className="block px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors rounded-lg">Press and collaborations</a>
                    </div>
                  </div>
                </div>

                <div className="py-6 space-y-2">
                  <Link to="/login" className="block w-full px-4 py-2 rounded-full bg-[#1A1D3E] text-sm text-white hover:bg-[#2C3170] transition-colors ring-1 ring-white/10 text-center">
                    Login
                  </Link>
                  <Link to="/register" className="block w-full px-4 py-2 rounded-full bg-sky-400 text-white hover:bg-sky-500 transition-colors text-center">
                    Get started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
