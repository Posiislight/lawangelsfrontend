
import bgImage from '../assets/lawangelsbg.jpg';
 // Ensure you have a suitable background image in your assets
export default function Hero() {
    return (
        <section className="relative h-[calc(100vh-55px)] font-worksans"> {/* Changed height and added margin-top */}
            {/* Hero Content */}
            
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${bgImage}')`
                }}
            >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 flex items-center h-full">
                <div className="w-full max-w-[1440px] mx-auto px-4">
                    <div className=" max-w-4xl">
                        {/* Main Heading */}
                        <h1 className="justify-start text-5xl font-worksans font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl lg:text-left">
                            Your Journey to{' '}
                            <span className="text-sky-400 lg:text-left">SQE</span>
                            <br />
                            Success Starts Here
                        </h1>
                        
                        {/* Subtitle */}
                        <p className="font-worksans mt-6 text-xl leading-8 text-gray-200 max-w-xl lg:text-left">
                            Master the Solicitors Qualifying Examination with expert-led courses, interactive practice tests, and a clear roadmap to becoming a qualified solicitor.
                        </p>
                        
                        {/* CTA Button */}
                        <div className="mt-10">
                            <button className="lg:float-left bg-sky-400 hover:bg-sky-500 text-white font-semibold py-4 px-8 rounded-full text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl lg:left">
                                Start your Journey
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Background Elements for Visual Interest */}
            <div className="absolute bottom-10 right-10 opacity-20">
                <div className="w-32 h-32 border border-white/30 rounded-lg transform rotate-12"></div>
                <div className="w-24 h-24 bg-sky-400/20 rounded-lg transform -rotate-6 -mt-16 ml-8"></div>
            </div>
        </section>
    );
}