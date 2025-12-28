import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import businesslawimg from '../assets/BUSINESS LAW.jpg';
import Dashboardcut from '../assets/Law Angelscut.jpg';

export default function Features() {
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const slideImages = [
        Dashboardcut,
        businesslawimg,
    ];

    // Auto-advance slides every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slideImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slideImages.length]);

    const features = [
        {
            title: "Expert-Led Video Lessons",
            description: "Learn from educators who break down complex legal concepts into practical, easy-to-grasp lessons.",
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="#25A9E0"/>
                  <path d="M14 28V19.5L20 16L26 19.5V28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 28H26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )
        },
        {
            title: "Comprehensive Practice Questions",
            description: "Test your knowledge with realistic SQE-style questions and mock exams that mirror the real test environment.",
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="#25A9E0"/>
                  <path d="M14 20H26M14 28H20M14 12H26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )
        },
        {
            title: "Personalised Study Plans",
            description: "Stay on track with tailored schedules that adapt to your pace, strengths, and areas needing improvement.",
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="#25A9E0"/>
                  <path d="M14 28V12H26V28H14Z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M20 20H26" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            )
        },
        {
            title: "24/7 Access, Anywhere",
            description: "Study at your own convenience with our fully online platform, on desktop, tablet, or mobile.",
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="20" fill="#25A9E0"/>
                  <path d="M14 20H26M20 14V26" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )
        }
    ];


    return (
        <section className="py-0 bg-white overflow-hidden px-0 md:py-20 md:bg-gray-50 md:px-6">
            {/* Mobile Design */}
            <div className="md:hidden px-4 pt-10 pb-2">
                <h2 className="text-2xl font-crimson text-gray-900 mb-8 leading-tight text-center">
                    Everything You Need to Pass the SQE <span className="text-sky-500 inline font-crimson">All in One Place</span>
                </h2>
                <div className="flex flex-col gap-10">
                    {features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex flex-row items-start gap-5">
                            <div className="flex-shrink-0">{feature.icon}</div>
                            <div className="text-left">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-700 leading-relaxed text-base">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Desktop/Tablet Design (original, md+) */}
            <div className="hidden md:block">
                <div className="mx-auto max-w-7xl px-0 lg:px-8">
                    {/* Centered heading */}
                    <div className="w-full flex justify-center">
                        <div className="max-w-3xl px-2 text-center">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-crimson text-gray-900 mb-4 leading-tight">Everything You Need to Pass the SQE</h2>
                            <p className="text-xl sm:text-2xl md:text-3xl text-sky-400 mb-8 font-medium font-crimson">
                                All in One Place
                            </p>
                        </div>
                    </div>

                    {/* Animated Scrolling Features */}
                    <style>{`
                        @keyframes scroll-left {
                            0% {
                                transform: translateX(0);
                            }
                            100% {
                                transform: translateX(-50%);
                            }
                        }
                        .feature-scroll {
                            animation: scroll-left 30s linear infinite;
                        }
                    `}</style>
                    
                    <div className="w-full overflow-hidden py-8">
                        <div className="feature-scroll flex gap-6">
                            {[...features, ...features].map((feature, index) => (
                                <div 
                                    key={index} 
                                    className="flex-shrink-0 w-80 flex flex-col items-center gap-4 p-6 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                                >
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mockup below features (full-bleed handled outside container) */}
                </div>

                {/* Slideshow mockup image */}
                <div className="mt-12 px-6 pb-12">
                    <div className="relative mx-auto max-w-6xl rounded-2xl overflow-hidden bg-gray-100 shadow-xl">
                        <div className="relative w-full h-screen max-h-[800px] flex items-start">
                            {/* Slides */}
                            <div className="relative w-full h-full overflow-hidden">
                            {slideImages.map((image, index) => (
                                <img
                                    key={index}
                                    src={image}
                                    alt={`Platform preview slide ${index + 1}`}
                                    className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ${
                                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <button
                            onClick={() => setCurrentSlide((prev) => (prev - 1 + slideImages.length) % slideImages.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 z-10"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>

                        <button
                            onClick={() => setCurrentSlide((prev) => (prev + 1) % slideImages.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 z-10"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-800" />
                        </button>

                        {/* Dots Indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {slideImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                        index === currentSlide
                                            ? 'bg-sky-500 w-8'
                                            : 'bg-white/60 hover:bg-white/80'
                                    }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}