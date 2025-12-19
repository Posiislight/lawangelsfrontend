import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Pricing() {

  const featureDetails = [
    {
      title: 'Angel AI Tutor',
      icon: 'psychology',
      description: 'Your personal legal revision assistant, available 24/7 to answer questions, clarify case law, and explain complex principles instantly.',
    },
    {
      title: 'Progress Tracker & Study Reports',
      icon: 'monitoring',
      description: 'Visual dashboards that track your performance over time, generating detailed reports to help you focus on areas that need improvement.',
    },
    {
      title: 'Graphic Reminders',
      icon: 'notifications_active',
      description: 'Stay organized with smart, visual notifications that keep your revision schedule on track and ensure you never miss a study session.',
    },
    {
      title: 'Study Plans',
      icon: 'calendar_month',
      description: 'Get personalized, structured revision timetables tailored to your exam dates, ensuring comprehensive coverage of all legal topics.',
    },
    {
      title: 'SQE Tips',
      icon: 'school',
      description: 'Expert strategies and practical tips designed specifically for the Solicitors Qualifying Examination to maximize your passing potential.',
    },
  ]

  const faqs = [
    {
      question: 'Can I upgrade my subscription later?',
      answer: 'Yes, you can upgrade to a longer subscription plan at any time. The additional cost will be prorated based on your remaining time.',
    },
    {
      question: 'What happens after my subscription expires?',
      answer: 'After your subscription period ends, you can renew at the same plan level or upgrade to a longer commitment. Your progress and study data are always saved.',
    },
    {
      question: 'How do the discounts work?',
      answer: 'Our 3-month plan saves you 17% compared to monthly billing, and the 6-month plan saves you 28%. These discounts reward your commitment to your SQE preparation.',
    },
    {
      question: 'Do I get a refund if I cancel early?',
      answer: 'Subscriptions are non-refundable, but you retain full access to your account until your subscription period ends. Please contact support to discuss your situation.',
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

        {/* FAQ Section */}
        <section className="w-full max-w-3xl px-4 pb-20">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer"
              >
                <summary className="flex items-center justify-between font-bold text-gray-900 dark:text-white text-lg">
                  {faq.question}
                  <span className="material-symbols-outlined transition-transform group-open:rotate-180">
                    expand_more
                  </span>
                </summary>
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-base leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
