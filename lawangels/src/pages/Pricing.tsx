import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function Pricing() {

  const plans = [
    {
      name: '1 Month',
      description: 'Perfect for getting started',
      price: '$29',
      period: '/month',
      isPrimary: false,
      buttonText: 'Subscribe Now',
      buttonStyle: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
      features: [
        'Expert-Led Video Lessons',
        'Comprehensive Practice Questions',
        'Personalised Study Plans',
        '24/7 Access, Anywhere',
      ],
    },
    {
      name: '3 Months',
      description: 'Great savings for your commitment',
      price: '$72',
      originalPrice: '$87',
      period: '/3 months',
      discount: '17% off',
      isPrimary: true,
      buttonText: 'Subscribe Now',
      buttonStyle: 'bg-blue-600 hover:bg-blue-700 text-white',
      features: [
        'Expert-Led Video Lessons',
        'Comprehensive Practice Questions',
        'Personalised Study Plans',
        '24/7 Access, Anywhere',
      ],
    },
    {
      name: '6 Months',
      description: 'Maximum value for your dedication',
      price: '$126',
      originalPrice: '$174',
      period: '/6 months',
      discount: '28% off',
      isPrimary: false,
      buttonText: 'Subscribe Now',
      buttonStyle: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
      features: [
        'Expert-Led Video Lessons',
        'Comprehensive Practice Questions',
        'Personalised Study Plans',
        '24/7 Access, Anywhere',
      ],
    },
  ]

  const comparisonFeatures = [
    {
      category: 'Core Learning Features',
      items: [
        { name: 'Expert-Led Video Lessons', oneMonth: true, threeMonths: true, sixMonths: true },
        { name: 'Comprehensive Practice Questions', oneMonth: true, threeMonths: true, sixMonths: true },
        { name: 'Personalised Study Plans', oneMonth: true, threeMonths: true, sixMonths: true },
        { name: '24/7 Access, Anywhere', oneMonth: true, threeMonths: true, sixMonths: true },
      ],
    },
    {
      category: 'Commitment Benefits',
      items: [
        { name: 'Savings', oneMonth: 'Standard', threeMonths: '17% off', sixMonths: '28% off' },
        { name: 'Flexible Access Duration', oneMonth: '1 Month', threeMonths: '3 Months', sixMonths: '6 Months' },
        { name: 'Renewal Required', oneMonth: 'Yes', threeMonths: 'Yes', sixMonths: 'Yes' },
      ],
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

  const logos = [
    { name: 'LexCorp', icon: 'balance' },
    { name: 'Justitia', icon: 'gavel' },
    { name: 'ShieldLaw', icon: 'verified_user' },
    { name: 'Pearson & Co', icon: 'corporate_fare' },
    { name: 'Global Legal', icon: 'account_balance' },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-worksans">
      <Navbar />
      
      <main className="w-full flex flex-col items-center mt-16">
        {/* Hero Section */}
        <section className="w-full max-w-7xl px-4 py-16 flex flex-col items-center text-center">
          <div className="flex flex-col gap-4 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Flexible Subscription Plans for Your Learning Journey
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-normal leading-normal">
              Choose the subscription length that works best for you. The longer you commit, the more you save!
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="w-full max-w-7xl px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative flex flex-col gap-6 rounded-xl border bg-white dark:bg-gray-800 p-6 lg:p-8 transition-all ${
                  plan.isPrimary
                    ? 'border-2 border-blue-600 shadow-xl shadow-blue-600/10 md:scale-105 z-10'
                    : 'border border-gray-200 dark:border-gray-700 hover:border-blue-600/50'
                }`}
              >
                {plan.isPrimary && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                {plan.discount && (
                  <div className="absolute -top-3 right-6 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {plan.discount}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-2 text-gray-900 dark:text-white">
                    <span className={`text-4xl font-black leading-tight ${plan.isPrimary ? 'text-blue-600' : ''}`}>
                      {plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-base font-bold text-gray-400 line-through">{plan.originalPrice}</span>
                    )}
                  </div>
                  {plan.period && <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{plan.period}</span>}
                </div>

                <button className={`w-full cursor-pointer items-center justify-center rounded-lg h-12 ${plan.buttonStyle} text-sm font-bold transition-colors`}>
                  {plan.buttonText}
                </button>

                <div className="flex flex-col gap-3">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex gap-3 text-sm text-gray-900 dark:text-gray-300">
                      <span className="material-symbols-outlined text-blue-600 text-[20px]">check</span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="w-full max-w-7xl px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Compare Features</h2>
            <p className="text-gray-600 dark:text-gray-400">Detailed breakdown of what's included in each plan.</p>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="p-4 text-left font-bold text-gray-900 dark:text-white w-1/3 sticky left-0 bg-gray-50 dark:bg-gray-900 z-10">
                    Features
                  </th>
                  <th className="p-4 text-center font-bold text-gray-900 dark:text-white w-1/5">1 Month</th>
                  <th className="p-4 text-center font-bold text-blue-600 w-1/5">3 Months</th>
                  <th className="p-4 text-center font-bold text-gray-900 dark:text-white w-1/5">6 Months</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {comparisonFeatures.map((section, sIdx) => (
                  <>
                    <tr key={`section-${sIdx}`}>
                      <td
                        colSpan={4}
                        className="p-3 bg-gray-100 dark:bg-gray-900 font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 sticky left-0 z-10"
                      >
                        {section.category}
                      </td>
                    </tr>
                    {section.items.map((item, iIdx) => (
                      <tr key={iIdx} className="group hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="p-4 text-gray-900 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/30 z-10">
                          {item.name}
                        </td>
                        <td className="p-4 text-center">
                          {typeof item.oneMonth === 'boolean' ? (
                            item.oneMonth ? (
                              <span className="material-symbols-outlined text-blue-600 inline-block">check</span>
                            ) : (
                              <span className="material-symbols-outlined text-gray-400 inline-block">remove</span>
                            )
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">{item.oneMonth}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof item.threeMonths === 'boolean' ? (
                            item.threeMonths ? (
                              <span className="material-symbols-outlined text-blue-600 font-bold inline-block">check</span>
                            ) : (
                              <span className="material-symbols-outlined text-gray-400 inline-block">remove</span>
                            )
                          ) : (
                            <span className="text-gray-900 dark:text-white font-medium">{item.threeMonths}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof item.sixMonths === 'boolean' ? (
                            item.sixMonths ? (
                              <span className="material-symbols-outlined text-blue-600 font-bold inline-block">check</span>
                            ) : (
                              <span className="material-symbols-outlined text-gray-400 inline-block">remove</span>
                            )
                          ) : (
                            <span className="text-gray-900 dark:text-white font-medium">{item.sixMonths}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
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
