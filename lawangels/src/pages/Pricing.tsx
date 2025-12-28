import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Pricing() {

  const featureDetails = [
    {
      title: 'Angel AI Tutor',
      icon: 'psychology',
      description: 'Meet your 24/7 legal study companion; ready to explain, quiz, and coach you through every topic.',
    },
    {
      title: 'Comprehensive Textbook with Audio Reader',
      icon: 'book',
      description: "Read your notes or let the audio reader do the work while you're on the go.",
    },
    {
      title: '40 Mock Exams',
      icon: 'assessment',
      description: 'Prepare for the SQE with mock questions, a speed reading tool, and a timer for focus.',
    },
    {
      title: 'Video Tutorials',
      icon: 'play_circle',
      description: 'Learn from expert-led video tutorials that break down complex legal concepts into easy-to-follow lessons.',
    },
    {
      title: 'Summary Notes',
      icon: 'note',
      description: 'Exam focused summaries that save you time and sharpen your understanding.',
    },
    {
      title: 'Flashcards',
      icon: 'layers',
      description: 'Revise smarter with high-quality flashcards that lock key legal concepts into memory.',
    },
    
    {
      title: 'Quizzes (1,500+ Questions)',
      icon: 'quiz',
      description: 'Challenge yourself with interactive quizzes that make learning fast, fun, and unforgettable.',
    },
    {
      title: 'Progress Tracker & Study Reports',
      icon: 'trending_up',
      description: 'Track your scores, monitor your study hours, and see how close you are to your goals.',
    },
    {
      title: 'SQE Tips',
      icon: 'school',
      description: 'Unlock exclusive insights and proven strategies to help you approach every SQE question with confidence.',
    },
    {
      title: 'Graphic Reminders',
      icon: 'layers',
      description: 'Remember more with visual memory aids that turn complicated ideas into simple, easy-to-grasp graphics.',
    },
    
  ]

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101822] font-worksans">
      <Navbar />
      
      <main className="w-full flex flex-col items-center justify-center mt-16">
        {/* Hero Section */}
        <section className="w-full max-w-6xl px-4 py-8 flex flex-col items-center text-center">
          <div className="flex flex-col gap-4 max-w-2xl">
            <h1 className="text-[#111418] dark:text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
              One Plan, Total Access
            </h1>
            <p className="text-[#617289] dark:text-gray-400 text-lg font-normal leading-normal">
              We believe in making legal education accessible. No hidden fees, no tiers.
            </p>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="w-full max-w-6xl px-4 pb-16">
          <div className="rounded-3xl bg-white dark:bg-[#1A2633] shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-[#f0f2f4] dark:border-[#2A3645] overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            {/* Left Side - Plan Details */}
            <div className="w-full md:w-5/12 lg:w-4/12 bg-[#f8fafc] dark:bg-[#15202b] p-8 lg:p-12 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-[#f0f2f4] dark:border-[#2A3645] relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#136dec]"></div>
              <h3 className="text-2xl font-bold text-[#111418] dark:text-white mb-2">Yearly Plan</h3>
              <div className="flex items-baseline justify-center my-6 text-[#111418] dark:text-white">
                <span className="text-5xl font-black">£0</span>
                <span className="text-xl text-[#617289] dark:text-gray-400 ml-2 font-medium">/ year</span>
              </div>
              <p className="text-[#617289] dark:text-gray-400 mb-8 max-w-[240px] text-sm leading-relaxed">
                Unlock the full potential of your revision with complete access to all features.
              </p>
              <button className="w-full max-w-[240px] cursor-pointer flex items-center justify-center rounded-lg h-12 bg-[#136dec] hover:bg-[#0e5bc4] text-white text-base font-bold transition-all shadow-lg shadow-[#136dec]/20 group">
                Get Started
                <span className="material-symbols-outlined ml-2 text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
              </button>
              <p className="text-xs text-[#617289] dark:text-gray-500 mt-4 font-medium">Free forever. No credit card required.</p>
            </div>

            {/* Right Side - Features */}
            <div className="w-full md:w-7/12 lg:w-8/12 p-8 lg:p-12">
              <h4 className="text-xl font-bold text-[#111418] dark:text-white mb-8 border-b border-[#f0f2f4] dark:border-[#2A3645] pb-4">Included Features</h4>
              <div className="flex flex-col gap-8">
                {featureDetails.map((feature, idx) => (
                  <div key={idx} className="flex gap-5 items-start">
                    <div className="w-12 h-12 rounded-xl bg-[#136dec]/10 flex items-center justify-center shrink-0 mt-1">
                      <span className="material-symbols-outlined text-[#136dec] text-2xl">{feature.icon}</span>
                    </div>
                    <div>
                      <h5 className="text-lg font-bold text-[#111418] dark:text-white">{feature.title}</h5>
                      <p className="text-[#617289] dark:text-gray-400 text-sm mt-2 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
