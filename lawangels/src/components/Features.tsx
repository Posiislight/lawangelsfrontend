import featureimg from '../assets/features image.png';

export default function Features() {
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

                    {/* Features in rows (grid) */}
                    <div className="mx-auto grid grid-cols-1 md:grid-cols-4 gap-11">
                        {[
                            {
                                title: "Expert-Led Video Lessons",
                                description: "Learn from experienced UK solicitors and educators who break down complex legal concepts into practical, easy-to-grasp lessons."
                            },
                            {
                                title: "Comprehensive Practice Questions",
                                description: "Test your knowledge with realistic SQE-style questions and mock exams that mirror the real test environment."
                            },
                            {
                                title: "Personalised Study Plans",
                                description: "Stay on track with tailored schedules that adapt to your pace, strengths, and areas needing improvement."
                            },
                            {
                                title: "24/7 Access, Anywhere",
                                description: "Study at your own convenience with our fully online platform, on desktop, tablet, or mobile."
                            }
                        ].map((feature, index) => (
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
            </div>
        </section>
    );
}