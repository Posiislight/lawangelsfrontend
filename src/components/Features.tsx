import featureimg from '../assets/features image.png';

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
        <section className="py-20 bg-gray-50 overflow-hidden px-6 md:px-0">
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

                {/* Features in rows (grid) */}
                <div className="mx-auto grid grid-cols-1 md:grid-cols-4 gap-11">
                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-row items-start gap-4 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105 cursor-pointer">
                            
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-base">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mockup below features (full-bleed handled outside container) */}
            </div>

            {/* Full-width mockup image */}
            <div className="mt-12 relative w-screen left-1/2 -translate-x-1/2 overflow-hidden">
                <img
                    src={featureimg}
                    alt="Platform preview"
                    className="w-screen h-3/6 object-cover transition-transform duration-500 hover:scale-110 cursor-pointer"
                />
            </div>
        </section>
    );
}