

export default function Features() {
    const features = [
        {
            title: "Expert-Led Video Lessons",
            description: "Learn from experienced UK solicitors and educators who break down complex legal concepts into practical, easy-to-grasp lessons.",
            icon: "🎓"
        },
        {
            title: "Comprehensive Practice Questions",
            description: "Test your knowledge with realistic SQE-style questions and mock exams that mirror the real test environment.",
            icon: "📝"
        },
        {
            title: "Personalised Study Plans",
            description: "Stay on track with tailored schedules that adapt to your pace, strengths, and areas needing improvement.",
            icon: "📊"
        },
        {
            title: "24/7 Access, Anywhere",
            description: "Study at your own convenience with our fully online platform, on desktop, tablet, or mobile.",
            icon: "🌐"
        }
    ];

    return (
        <section className="py-20 bg-gray-50 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center">
                    {/* Left side - Text content */}
                    <div>
                        <h2 className="text-5xl font-worksans text-gray-900 mb-4 leading-tight lg:text-left whitespace-nowrap">Everything You Need to Pass the SQE</h2>
                        <p className="text-3xl text-sky-400 mb-12 font-medium lg:text-left">
                            All in One Place
                        </p>
                        
                        <div className="space-y-8">
                            {features.map((feature, index) => (
                                <div key={index} className="flex flex-col">
                                    <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center mb-4">
                                        <div className="w-8 h-8 rounded-full bg-sky-400"></div>
                                    </div>
                                    <div>
                                        <h3 className="lg:text-left text-xl font-semibold text-gray-900 mb-3">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed text-base lg:text-left">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right side - Image placeholder */}
                    <div className="relative -mx-4 sm:mx-0">
                        <img 
                            width="2000" 
                            height="2500" 
                            src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png" 
                            alt="Product screenshot" 
                            className="w-[50rem] h-[30rem] max-w-none rounded-xl shadow-xl ring-1 ring-gray-400/10 sm:w-[57rem] md:ml-8 lg:ml-32"
                        />
                        
                        {/* Bottom sections placeholder */}
                        
                    </div>
                </div>
            </div>
        </section>
    );
}