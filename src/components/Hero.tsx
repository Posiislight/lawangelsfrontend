
import bgImage from '../assets/newheropic.jpg';
 // Ensure you have a suitable background image in your assets
export default function Hero() {
    return (
        <section id="home" className="relative h-[100vh] font-worksans"> {/* Changed height and added margin-top */}
            {/* Hero Content */}
            
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
  className="font-worksans font-semibold text-[50px] leading-[100%] tracking-[-0.06em] text-center text-white mx-auto"
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
                            <button className="bg-sky-400 hover:bg-sky-500 text-black font-medium py-3 px-6 rounded-full text-base transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl mx-auto">
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