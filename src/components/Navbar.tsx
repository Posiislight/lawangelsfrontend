import { useState } from 'react';
import logo from '../assets/lawangelslogo.png';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-4 left-0 right-0 z-40 font-worksans">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between rounded-full bg-[#1A1D3E] text-white shadow-lg ring-1 ring-white/10 px-4 h-[56px]">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="LawAngels" className="h-12 w-16" />
          </a>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex gap-x-8">
            <li><a href="/AboutUs" className="text-sm text-white/80 hover:text-white transition-colors">About Us</a></li>
            <li><a href="/Pathtoqualification" className="text-sm text-white/80 hover:text-white transition-colors">Blog</a></li>
            <li><a href="#pricing" className="text-sm text-white/80 hover:text-white transition-colors">Pricing</a></li>
            <li><a href="#contact" className="text-sm text-white/80 hover:text-white transition-colors">Contact</a></li>
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
                  <img src={logo} alt="LawAngels" className="h-6 w-auto" />
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
                <div className="space-y-2 py-6">
                  <a href="#about" className="block rounded-lg px-3 py-2 text-base font-medium text-white/90 hover:bg-white/10 transition-colors">About Us</a>
                  <a href="#courses" className="block rounded-lg px-3 py-2 text-base font-medium text-white/90 hover:bg-white/10 transition-colors">Courses</a>
                  <a href="#pricing" className="block rounded-lg px-3 py-2 text-base font-medium text-white/90 hover:bg-white/10 transition-colors">Pricing</a>
                  <a href="#contact" className="block rounded-lg px-3 py-2 text-base font-medium text-white/90 hover:bg-white/10 transition-colors">Contact</a>
                </div>
                <div className="py-6 space-y-2">
                  <button className="px-4 py-2 rounded-full bg-[#1A1D3E] text-sm text-white hover:bg-[#2C3170] transition-colors">
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
