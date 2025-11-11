import { useState } from 'react';
import logo from '../assets/lawangelslogo.png';
import logotext from '../assets/logotext.png';
export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-4 left-0 right-0 z-40 font-worksans">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between rounded-full bg-[#1A1D3E] text-white shadow-lg ring-1 ring-white/10 px-4 h-[56px]">
          {/* Logo */}
          <a href="/" className="flex items-center ">
          <img src={logo} alt="logo" className='w-14' />
          <img src={logotext} alt="logo" className='w-[93px] h-[20px] mt-2 -mx-2' />
          </a>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex gap-x-8">
            <li className="relative group ">
              <a href="/about-us" className="text-sm text-white/80 hover:text-[#0089FF] transition-colors">About Us</a>
                <div className='absolute flex flex-row gap-20 top-[40px] px-10 -left-80 bg-white/80 backdrop-blur-sm rounded-xl mt-5 shadow-lg group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 z-50 p-4 min-w-[600px] '>
                  <div className='flex flex-col py-2 space-y-2'>
                    <p className='text-base text-[#1A1D3E] font-semibold whitespace-nowrap pl-2'>About Us</p>
                    <a href="/about-us/mission" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">Our Mission</a>
                    <a href="/about-us/how-we-support" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">How We Support</a>
                    <a href="/about-us/testimonials" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">Testimonials & reviews</a>
                  </div>
                  <div className='flex flex-col py-2 space-y-2'>
                    <p className='text-base text-[#1A1D3E] font-semibold whitespace-nowrap pl-2'>Path to Qualification</p>
                    <a href="/path-to-qualification/sqe-route" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">How to qualify as a solicitor via the SQE Route</a>
                    <a href="/path-to-qualification/assessment-dates" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">Assessment time & key dates for SQE Assessment 2026</a>
                    <a href="/path-to-qualification/registration" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">Registering after you pass and admission </a>
                    <a href="/path-to-qualification/overseas-pathways" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">Overseas lawyer pathways and exemptions </a>
                  </div>
                  <div className='flex flex-col py-2 space-y-2'>
                    <p className='text-base text-[#1A1D3E] font-semibold whitespace-nowrap pl-2'>Prep Tools</p>
                    <a href="/prep-tools/pricing" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">Pricing & features</a>
                    <a href="/prep-tools/sample-mcqs" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">Sample MCQs</a>
                  </div>
                  <div className='flex flex-col py-2 space-y-2'>
                    <p className='text-base text-[#1A1D3E] font-semibold whitespace-nowrap pl-2 gap-3'>Get in Touch </p>
                    <a href="/contact/call-us" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-2 pl-2">Call us</a>
                    <a href="/contact/support" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">Email support </a>
                    <a href="/contact/press" className="text-sm text-gray-700 hover:bg-gray-100 whitespace-nowrap py-1 pl-2">Press and collaborations</a>
                  </div>
                </div>
              </li>
            <li><a href="/blog" className="text-sm text-white/80 hover:text-[#0089FF] transition-colors">Blog</a></li>
            <li><a href="/pricing" className="text-sm text-white/80 hover:text-[#0089FF] transition-colors">Prep Tools</a></li>
            <li><a href="/contact" className="text-sm text-white/80 hover:text-[#0089FF] transition-colors">Get in Touch</a></li>
          </ul>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-x-3">
            <button className="px-4 py-2 rounded-full text-sm bg-[#1A1D3E] text-white/80 hover:text-white ">
              Login
            </button>
            <button className="px-4 py-2 rounded-full bg-sky-400 text-white text-sm hover:bg-sky-500 transition-colors">
              Get started
            </button>
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
                <div className="flex items-center gap-2">
                  <img src={logo} alt="LawAngels" className="h-10 w-14 object-contain" />
                </div>

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
                  <button className="w-full px-4 py-2 rounded-full bg-[#1A1D3E] text-sm text-white hover:bg-[#2C3170] transition-colors ring-1 ring-white/10">
                    Login
                  </button>
                  <button className="w-full px-4 py-2 rounded-full bg-sky-400 text-white hover:bg-sky-500 transition-colors">
                    Get started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
