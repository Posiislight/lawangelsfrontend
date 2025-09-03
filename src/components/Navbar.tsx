import { useState } from 'react';

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    return (
        <nav className="bg-white font-worksans">
            <div className="max-w-[1440px] mx-auto px-4">
                <div className="flex items-center justify-between h-[55px]">
                    {/* Logo */}
                    <div className="flex items-center">
                        <h2 className="text-2xl font-bold">
                            <span className="text-orange-400">Law</span>
                            <span className="text-sky-400">Angels</span>
                        </h2>
                    </div>
                    
                    {/* Desktop Navigation */}
                    <ul className="hidden lg:flex lg:gap-x-8">
                        <li className="cursor-pointer hover:text-gray-600 transition-colors">About Us</li>
                        <li className="cursor-pointer hover:text-gray-600 transition-colors">Courses</li>
                        <li className="cursor-pointer hover:text-gray-600 transition-colors">Pricing</li>
                        <li className="cursor-pointer hover:text-gray-600 transition-colors">Contact</li>
                    </ul>
                    
                    {/* Desktop Buttons */}
                    <div className="hidden lg:flex lg:gap-x-4">
                        <button className="px-4 py-2 rounded-full border border-sky-400 text-sky-400 hover:bg-sky-50 transition-colors">
                            Login
                        </button>
                        <button className="px-4 py-2 rounded-full bg-sky-400 text-white hover:bg-sky-500 transition-colors">
                            Get started
                        </button>
                    </div>
                    
                    {/* Mobile menu button */}
                    <div className="lg:hidden">
                        <button
                            type="button"
                            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <span className="sr-only">Open main menu</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden">
                    <div className="fixed inset-0 z-50">
                        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)} />
                        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">
                                    <span className="text-orange-400">Law</span>
                                    <span className="text-sky-400">Angels</span>
                                </h2>
                                <button
                                    type="button"
                                    className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="sr-only">Close menu</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="mt-6 flow-root">
                                <div className="space-y-2 py-6">
                                    <a href="#" className="block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors">About Us</a>
                                    <a href="#" className="block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors">Courses</a>
                                    <a href="#" className="block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors">Pricing</a>
                                    <a href="#" className="block rounded-lg px-3 py-2 text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors">Contact</a>
                                </div>
                                <div className="py-6 space-y-2">
                                    <button className="w-full px-4 py-2 rounded-full border border-sky-400 text-sky-400 hover:bg-sky-50 transition-colors">
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