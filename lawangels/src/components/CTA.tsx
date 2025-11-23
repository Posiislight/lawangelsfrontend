import CTAimage from '../assets/pathctaimage.jpg';

export default function CTA() {
    return (
        <div className="relative w-full font-worksans">
            {/* Background Image with Overlay */}
            <div className="relative h-screen overflow-hidden">
                <img 
                    src={CTAimage} 
                    alt="Law Angels Background" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-black bg-opacity-70"></div>
                
                {/* Content Container */}
                <div className="relative z-10 max-w-6xl mx-auto px-4 h-full flex flex-col justify-center">
                    <h2 className="text-white text-4xl md:text-5xl font-normal mb-12">
                        Law Angels<br />
                        Success Tips:
                    </h2>

                    {/* Tips Grid */}
                    <div className="md:grid-cols-2 gap-8 max-w-md bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer">
                        {/* Network */}
                        
                            <h3 className="text-gray-800 text-xl font-medium mb-3">Network</h3>
                            <p className="text-gray-600">
                                Join our Law Angels community for peer support and mentor connections.
                            </p>
                        {/* Stay Updated */}
                            <h3 className="text-gray-800 text-xl font-medium mb-3">Stay Updated</h3>
                            <p className="text-gray-600 mb-3">
                                Our subscribers get SRA bulletins and prep resources first.
                            </p>
                        

                        {/* Balance */}
                        
                            <h3 className="text-gray-800 text-xl font-medium mb-3">Balance</h3>
                            <p className="text-gray-600 mb-3">
                                Study part-time with QWE to avoid burnout.
                            </p>
                        

                        {/* Prep Smart */}
                        
                            <h3 className="text-gray-800 text-xl font-medium mb-3">Prep Smart</h3>
                            <p className="text-gray-600 mb-3">
                                Law Angels' SQE courses, exclusive to subscribers, offer mock exams and video tutorials.
                            </p>
                        
                    </div>

                    {/* CTA Button */}
                    <button className="mt-8 px-8 py-3 bg-orange-500 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-orange-600 hover:shadow-lg hover:scale-105 cursor-pointer">
                        Start Your Journey
                    </button>
                </div>
            </div>
        </div>
    );
}