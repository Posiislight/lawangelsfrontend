import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function TermsAndConditions() {
  const [openSections, setOpenSections] = useState({
    intro: true,
    part1s1: false,
    part1s2: false,
    part1s3: false,
    part1s4: false,
    part1s5: false,
    part1s6: false,
    part1s7: false,
    part1s8: false,
    part2s1: false,
    part2s2: false,
    part2s3: false,
    part3s1: false,
    part3s2: false,
    part3s3: false,
    part3s4: false,
    part3s5: false,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <>
      <div className='w-full font-worksans mx-auto md:min-h-screen'>
        <Navbar />
        
        {/* Desktop/Tablet Layout */}
        <div className='hidden md:block'>
          <div className='relative flex bg-[#1A1D3E] max-w-[1200px] mx-auto justify-center m-auto mt-28 rounded-2xl h-[184px] shadow-lg shadow-[-7px_9px_17.3px_2px_#44444447]'>
            <div className='absolute left-4 top-3 font-normal text-white text-normal'>
              Terms and Conditions {'>'}
            </div>
            <div className='absolute right-9 top-2 text-white my-auto'>
              <svg width="80" height="80" viewBox="0 0 242 221" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M117.689 9.78197C123.922 -3.15436 142.721 -1.96727 147.277 11.6503L179.432 107.764C179.899 109.159 180.556 110.483 181.384 111.698L238.462 195.447C246.549 207.313 236.121 223 222.05 220.137L122.736 199.927C121.294 199.634 119.819 199.541 118.352 199.65L17.2848 207.207C2.96532 208.277 -5.40624 191.403 4.10899 180.649L71.2679 104.745C72.2427 103.643 73.0608 102.412 73.6993 101.087L117.689 9.78197Z" fill="white" fill-opacity="0.66"/>
              </svg>
            </div>
            <div className='absolute left-4 bottom-10 font-[500] text-white text-[40px] font-crimson'>Terms and Conditions</div>
          </div>

          <div className='text-lg max-w-[1000px] mx-auto'>
            <p className='mt-10 text-gray-700'>
              Please read these Terms and Conditions carefully. Use of the Law Angels website, mobile applications, online learning platform, subscription services, and any printed or digital study materials constitutes acceptance of these Terms.
            </p>
          </div>

          <div className="flex max-w-[1200px] mx-auto mt-10 mb-20 items-start gap-8">
            {/* Main content */}
            <div className="w-full">
              
              {/* Introduction */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('intro')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>Introduction</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.intro ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.intro && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      These Terms and Conditions govern your access to and use of the Law Angels website, mobile applications, online learning platform, subscription services, and any printed or digital study materials (collectively, the "Platform" or "Products").
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Use of the Platform constitutes acceptance of these Terms. If you do not agree to these Terms, you must not use or access the Platform.
                    </p>
                    <p className='text-base font-semibold text-gray-900 mt-4'>Contact Information:</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li><b>General enquiries:</b> contact@lawangelsuk.com</li>
                      <li><b>Partnerships, press, or collaboration:</b> partnerships@lawangelsuk.com</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* PART I – SUBSCRIPTION SERVICES */}
              <h2 className='text-2xl font-bold font-crimson text-gray-900 mt-8 mb-4'>PART I – SUBSCRIPTION SERVICES</h2>

              {/* Section 1 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part1s1')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>1. Our Contract with You</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part1s1 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part1s1 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      The Platform provides study and revision resources for candidates preparing for the Solicitors Qualifying Examination (SQE), including high-yield notes, flashcards, mock exams, tutorial videos, AI-assisted study tools, and study plans.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Content is regularly updated; the Platform is never a "final" product. We may upload new materials, modify existing content, or remove outdated content at our discretion.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      By subscribing, you confirm that you understand the Platform is for educational purposes only and does not constitute legal advice or professional consultancy.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      These Terms apply to all subscribers. Changes to these Terms will be posted on the Platform. Continued use of the Platform after changes constitutes acceptance of the new Terms.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      To access most content, you must create an account and subscribe to a plan. Account registration requires personal information (name, email, payment details). Personal data will be processed in accordance with our Privacy Policy.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      The subscription contract begins upon successful payment and account activation.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Your password and account details must remain confidential. Suspected breaches must be reported immediately. We may suspend your account in case of security concerns.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 2 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part1s2')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>2. Fees and Payment</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part1s2 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part1s2 && (
                  <div className='p-4 pt-0'>
                    <ul className='list-decimal list-inside text-base text-gray-700 mt-4 space-y-3'>
                      <li>Subscription fees and plans are clearly displayed on the Platform.</li>
                      <li>Payments are processed via approved gateways (e.g., Stripe, PayPal).</li>
                      <li>Subscriptions may be monthly or annually. Payment authorises automatic renewal unless cancelled in advance.</li>
                      <li>Failure to pay may result in suspension of access.</li>
                      <li>Fees may be adjusted with 30 days' prior notice for future subscriptions; existing subscriptions are unaffected.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 3 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part1s3')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>3. Cancellation and Refunds</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part1s3 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part1s3 && (
                  <div className='p-4 pt-0'>
                    <ul className='list-decimal list-inside text-base text-gray-700 mt-4 space-y-3'>
                      <li>You may cancel within 14 days of payment for a full refund, provided you have not accessed significant content (e.g., streamed videos or mock exams).</li>
                      <li>After 14 days, subscriptions may be cancelled at any time; however, fees for the remaining period are non-refundable.</li>
                      <li>Refunds, where applicable, will be processed via the original payment method within 10 business days.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 4 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part1s4')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>4. Licence and Intellectual Property</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part1s4 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part1s4 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We grant you a limited, non-exclusive, non-transferable licence to access Platform content for personal study only.
                    </p>
                    <p className='text-base font-semibold text-gray-900 mt-4'>You may not:</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Share, copy, distribute, or sell content</li>
                      <li>Download or reproduce content except for personal use</li>
                      <li>Modify, reverse engineer, or create derivative works</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      All Platform intellectual property, including trademarks, logos, and content, remains our property.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 5 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part1s5')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>5. User Obligations and Conduct</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part1s5 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part1s5 && (
                  <div className='p-4 pt-0'>
                    <ul className='list-decimal list-inside text-base text-gray-700 mt-4 space-y-3'>
                      <li>You must not upload viruses, malware, or harmful files.</li>
                      <li>You must not attempt unauthorised access to our systems.</li>
                      <li>Misuse of the Platform may result in suspension, termination, reporting for dishonesty or legal action.</li>
                      <li>Users must provide accurate and up-to-date personal information.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 6 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part1s6')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>6. Platform Availability</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part1s6 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part1s6 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We aim to provide uninterrupted access but cannot guarantee continuous availability.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Temporary interruptions may occur for maintenance, updates, or events beyond our control.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 7 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part1s7')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>7. AI Tutor Disclaimer</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part1s7 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part1s7 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Angel AI Tutor is a study assistance tool. Outputs are algorithm-generated and may not always be accurate or complete.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      You must independently verify AI-generated content.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Law Angels accepts no liability for results or decisions based on AI outputs.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 8 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part1s8')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>8. Limitation of Liability</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part1s8 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part1s8 && (
                  <div className='p-4 pt-0'>
                    <ul className='list-decimal list-inside text-base text-gray-700 mt-4 space-y-3'>
                      <li>The Platform is intended solely as study support.</li>
                      <li>Law Angels is not responsible for exam results, study outcomes, or reliance on content instead of independent research or legal advice.</li>
                      <li>We are not liable for indirect, incidental, or consequential losses, including business loss.</li>
                      <li>Our liability is limited to the greater of £500 or twice the subscription fee paid during the preceding 12 months.</li>
                      <li>Nothing limits liability for death or personal injury caused by negligence, fraud, or other liabilities that cannot be excluded under UK law.</li>
                      <li>Law Angels is an independent study platform, not a law school or tutoring service. Our resources are designed for self-directed SQE preparation and are provided as-is on our website and platform. While we regularly enhance our content, we do not guarantee personalised instruction, one-to-one tutoring, or ongoing explanations beyond the materials made available on the Platform.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* PART II – PRINTED AND DIGITAL PRODUCTS */}
              <h2 className='text-2xl font-bold font-crimson text-gray-900 mt-8 mb-4'>PART II – PRINTED AND DIGITAL PRODUCTS</h2>

              {/* Part II Section 1 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part2s1')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>1. Delivery Policy</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part2s1 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part2s1 && (
                  <div className='p-4 pt-0'>
                    <ul className='list-decimal list-inside text-base text-gray-700 mt-4 space-y-3'>
                      <li>Orders are processed within 1–2 business days; UK delivery takes up to 10 working days. International delivery may take up to 20 working days.</li>
                      <li>Delivery times are indicative only. Delays outside our control (e.g., postal delays) do not entitle you to compensation.</li>
                      <li>Risk passes to you upon delivery; ownership transfers once full payment is received.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Part II Section 2 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part2s2')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>2. Returns and Refunds</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part2s2 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part2s2 && (
                  <div className='p-4 pt-0'>
                    <ul className='list-decimal list-inside text-base text-gray-700 mt-4 space-y-3'>
                      <li>You may exercise the right to cancel within 14 days of receipt, but return postage is usually at your cost unless the product is faulty.</li>
                      <li>Refunds are processed within 10 business days of receipt of returned goods in resaleable condition.</li>
                      <li>Deductions may apply for damage caused during handling.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Part II Section 3 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part2s3')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>3. Printed Product Disclaimers</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part2s3 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part2s3 && (
                  <div className='p-4 pt-0'>
                    <ul className='list-decimal list-inside text-base text-gray-700 mt-4 space-y-3'>
                      <li>Products are intended as study aids for SQE preparation only.</li>
                      <li>While we make best efforts for accuracy, errors or discrepancies may exist.</li>
                      <li>Products are not a replacement for legal study, professional guidance, or independent verification.</li>
                      <li>We do not guarantee that any content will appear on actual SQE exams.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* PART III – GENERAL TERMS */}
              <h2 className='text-2xl font-bold font-crimson text-gray-900 mt-8 mb-4'>PART III – GENERAL TERMS</h2>

              {/* Part III Section 1 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part3s1')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>1. Data Protection</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part3s1 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part3s1 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Personal data is handled according to our Privacy Policy in compliance with UK GDPR.
                    </p>
                  </div>
                )}
              </div>

              {/* Part III Section 2 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part3s2')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>2. Contract Termination</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part3s2 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part3s2 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We may terminate access for breach of Terms, non-payment, or misuse.
                    </p>
                  </div>
                )}
              </div>

              {/* Part III Section 3 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part3s3')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>3. Transfers and Third Parties</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part3s3 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part3s3 && (
                  <div className='p-4 pt-0'>
                    <ul className='list-decimal list-inside text-base text-gray-700 mt-4 space-y-3'>
                      <li>We may transfer rights or obligations to another party, giving notice.</li>
                      <li>You may not transfer your rights without written consent.</li>
                      <li>No third party has rights under this contract.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Part III Section 4 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part3s4')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>4. Governing Law</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part3s4 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part3s4 && (
                  <div className='p-4 pt-0'>
                    <ul className='list-decimal list-inside text-base text-gray-700 mt-4 space-y-3'>
                      <li>These Terms are governed by the laws of England and Wales.</li>
                      <li>Disputes are subject to the exclusive jurisdiction of the courts of England and Wales.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Part III Section 5 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('part3s5')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>5. Disclaimer</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.part3s5 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.part3s5 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      The Platform and Products are intended solely for SQE preparation. They are educational tools, not legal advice, tutoring, or certification. Reliance on content is at the user's discretion.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className='md:hidden px-4 py-8'>
          <h1 className='text-3xl font-bold font-crimson text-gray-900 mb-2'>Terms and Conditions</h1>
          <p className='text-base text-gray-700 mb-6'>
            Please read these Terms and Conditions carefully. Use of the Law Angels website, mobile applications, online learning platform, subscription services, and any printed or digital study materials constitutes acceptance of these Terms.
          </p>

          {/* Mobile Accordions */}
          <div className="space-y-4">
            {/* Introduction Mobile */}
            <div className='bg-white rounded-lg border border-gray-300'>
              <button
                onClick={() => toggleSection('intro')}
                className='w-full text-left p-4 cursor-pointer'
              >
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold font-crimson'>Introduction</h3>
                  <span className='text-xl font-bold text-gray-600'>
                    {openSections.intro ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openSections.intro && (
                <div className='p-4 pt-0 text-sm text-gray-700 space-y-3'>
                  <p>Law Angels Limited is registered in England and Wales with Company Number 16779175, registered office at 20 Wenlock Road, London N1 7GU.</p>
                  <p><b>Contact:</b> contact@lawangelsuk.com or partnerships@lawangelsuk.com</p>
                </div>
              )}
            </div>

            {/* All other sections - abbreviated for mobile */}
            {[
              { key: 'part1s1', title: '1. Our Contract with You' },
              { key: 'part1s2', title: '2. Fees and Payment' },
              { key: 'part1s3', title: '3. Cancellation and Refunds' },
              { key: 'part1s4', title: '4. Licence and IP' },
              { key: 'part1s5', title: '5. User Obligations' },
              { key: 'part1s6', title: '6. Platform Availability' },
              { key: 'part1s7', title: '7. AI Tutor Disclaimer' },
              { key: 'part1s8', title: '8. Limitation of Liability' },
              { key: 'part2s1', title: 'Part II: Delivery Policy' },
              { key: 'part2s2', title: 'Part II: Returns and Refunds' },
              { key: 'part2s3', title: 'Part II: Product Disclaimers' },
              { key: 'part3s1', title: 'Part III: Data Protection' },
              { key: 'part3s2', title: 'Part III: Termination' },
              { key: 'part3s3', title: 'Part III: Transfers' },
              { key: 'part3s4', title: 'Part III: Governing Law' },
              { key: 'part3s5', title: 'Part III: Disclaimer' },
            ].map(({ key, title }) => (
              <div key={key} className='bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection(key as keyof typeof openSections)}
                  className='w-full text-left p-4 cursor-pointer'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold font-crimson'>{title}</h3>
                    <span className='text-xl font-bold text-gray-600'>
                      {openSections[key as keyof typeof openSections] ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections[key as keyof typeof openSections] && (
                  <div className='p-4 pt-0 text-sm text-gray-700'>
                    <p>Expand this section to view full details.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}
