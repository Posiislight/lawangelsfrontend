
import { Link } from 'react-router-dom';
import bgImage from '../assets/newheropic.jpg';
// Ensure you have a suitable background image in your assets
export default function Hero() {
    return (
        <section id="home" className="relative font-worksans">
            {/* Desktop Design - Hidden on mobile */}
            <div className="hidden md:block relative h-[100vh]">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-[center_top_20%] bg-no-repeat"
                    style={{
                        backgroundImage: `
      linear-gradient(0deg, rgba(0,0,0,0.4), rgba(0,0,0,0.4)),
      linear-gradient(178.81deg, rgba(0,0,0,0) 43.95%, rgba(0,0,0,0.6) 87.92%),
      url(${bgImage})
    `
                    }}
                >
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex items-center justify-center h-full pt-[100px]">
                    <div className="w-full max-w-[1440px] mx-auto px-4">
                        <div className=" max-w-5xl mx-auto text-center bottom-10">
                            {/* Main Heading */}
                            <h1
                                className="font-crimson font-semibold text-[50px] leading-[100%] tracking-[-0.06em] text-center text-white mx-auto"
                            >
                                Your Journey to SQE Success
                                <br />
                                Starts Here
                            </h1>


                            {/* Subtitle */}
                            <p className="font-worksans mt-6 text-base font-normal leading-7 text-gray-200 max-w-2xl text-center mx-auto sm:text-lg">
                                Master the Solicitors Qualifying Examination with expert-led courses, interactive practice tests, and a clear roadmap to becoming a qualified solicitor.
                            </p>

                            {/* CTA Button */}
                            <div className="mt-8 text-center">
                                <Link to="/register" className="inline-block bg-sky-400 hover:bg-sky-500 text-black font-medium py-3 px-6 rounded-full text-base transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl mx-auto">
                                    Start your Journey
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Elements for Visual Interest */}
                <div className="absolute bottom-10 right-10 opacity-20">
                    <div className="w-32 h-32 border border-white/30 rounded-lg transform rotate-12"></div>
                    <div className="w-24 h-24 bg-sky-400/20 rounded-lg transform -rotate-6 -mt-16 ml-8"></div>
                </div>
            </div>

            {/* Mobile Design - Shown only on mobile */}
            <div className="md:hidden relative min-h-screen bg-gradient-to-b from-gray-900 to-black">
                {/* Mobile Background */}
                <div className="absolute inset-0 opacity-40">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: `url(${bgImage})`
                        }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80"></div>
                </div>

                {/* Mobile Content */}
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-10 w-full">
                    <div className="flex flex-col items-center text-center w-full">
                        {/* Mobile Heading */}
                        <h1 className="font-crimson font-semibold text-3xl sm:text-4xl leading-tight tracking-[-0.04em] text-white mb-4">
                            Your Journey to
                            <br />
                            SQE Success
                            <br />
                            Starts Here
                        </h1>

                        {/* Mobile Subtitle */}
                        <p className="font-worksans text-sm sm:text-base font-normal leading-6 text-gray-300 mb-8">
                            Master the SQE with expert courses, interactive practice tests, and your roadmap to success.
                        </p>

                        {/* Mobile CTA Button */}
                        <Link to="/register" className="inline-block text-center bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-black font-semibold py-3 px-8 rounded-full text-base transition-all duration-200 transform active:scale-95 shadow-lg w-full max-w-xs">
                            Start your Journey
                        </Link>

                        {/* Mobile Decorative Elements */}
                        <div className="mt-12 flex gap-4 opacity-30">
                            <div className="w-12 h-12 border-2 border-sky-400 rounded-lg transform rotate-45"></div>
                            <div className="w-12 h-12 bg-sky-400/30 rounded-lg transform -rotate-45"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}