import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function PrivacyPolicy() {
  const [openSections, setOpenSections] = useState({
    section1: true,
    section2: false,
    section3: false,
    section4: false,
    section5: false,
    section6: false,
    section7: false,
    section8: false,
    section9: false,
    section10: false,
    section11: false,
    section12: false,
    section13: false,
    section14: false,
    section15: false,
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
              Privacy Policy {'>'}
            </div>
            <div className='absolute right-9 top-2 text-white my-auto'>
              <svg width="80" height="80" viewBox="0 0 242 221" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M117.689 9.78197C123.922 -3.15436 142.721 -1.96727 147.277 11.6503L179.432 107.764C179.899 109.159 180.556 110.483 181.384 111.698L238.462 195.447C246.549 207.313 236.121 223 222.05 220.137L122.736 199.927C121.294 199.634 119.819 199.541 118.352 199.65L17.2848 207.207C2.96532 208.277 -5.40624 191.403 4.10899 180.649L71.2679 104.745C72.2427 103.643 73.0608 102.412 73.6993 101.087L117.689 9.78197Z" fill="white" fill-opacity="0.66"/>
              </svg>
            </div>
            <div className='absolute left-4 bottom-10 font-[500] text-white text-[40px] font-crimson'>Privacy Policy</div>
          </div>

          <div className='text-lg max-w-[1000px] mx-auto'>
            <p className='mt-10 text-gray-700'>
              At Law Angels, we are committed to protecting your privacy and handling your personal information fairly, transparently, and securely. This Privacy Policy explains how and why we collect, use, store, disclose, and protect your personal information, and the rights you have in relation to that information.
            </p>
            <p className='mt-6 text-sm text-gray-600'>
              Last updated: 20 December 2025
            </p>
          </div>

          <div className="flex max-w-[1200px] mx-auto mt-10 mb-20 items-start gap-8">
            {/* Main content */}
            <div className="w-full">
              
              {/* Section 1 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section1')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>1. Introduction</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section1 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section1 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      All references to "we", "us", "our", or "Law Angels" in this Privacy Policy refer to Law Angels Limited, its subsidiaries, affiliates, and associates.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Law Angels is the Data Controller in respect of the personal data you provide to us, in accordance with the UK General Data Protection Regulation ("UK GDPR") and the Data Protection Act 2018.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      We are committed to protecting your privacy and handling your personal information fairly, transparently, and securely. This Privacy Policy explains how and why we collect, use, store, disclose, and protect your personal information, and the rights you have in relation to that information.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      By providing your personal information to us, you confirm that you have read and understood this Privacy Policy and agree to the processing of your personal data as described.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      If you do not agree, please do not provide personal information or use our services.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      We may update this Privacy Policy from time to time. We encourage you to review it regularly to ensure you are aware of the most current version.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 2 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section2')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>2. What Is Personal Information</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section2 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section2 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      "Personal information" means any information relating to an identified or identifiable individual, as defined under applicable data protection law.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      This includes information such as your name, contact details, online identifiers, and study-related data. It does not include anonymised or aggregated data that cannot be used to identify you, nor general business contact information where it does not identify you personally.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 3 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section3')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>3. How We Collect Personal Information</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section3 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section3 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We collect personal information in the following ways:
                    </p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-4 space-y-2'>
                      <li><b>Directly from you</b> when you register for an account, subscribe to our courses or services, contact us with an enquiry, complete forms or surveys, use our learning platform, or submit reviews.</li>
                      <li><b>Automatically</b> through your use of our website and platform (e.g. cookies, log files)</li>
                      <li><b>From third parties</b> you have authorised (e.g. payment providers)</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      You always have a choice about whether to provide personal information. Where possible, we allow you to manage your preferences, including marketing communications.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 4 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section4')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>4. Categories of Personal Information We Collect</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section4 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section4 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base font-semibold text-gray-900 mt-4'>4.1 Personal Identifiers</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>First and last name</li>
                      <li>Gender (where voluntarily provided)</li>
                      <li>Country of residence</li>
                      <li>Legal background and professional status (e.g. SQE candidate, trainee solicitor, foreign qualified lawyer)</li>
                      <li>Country of qualification (where applicable)</li>
                    </ul>

                    <p className='text-base font-semibold text-gray-900 mt-4'>4.2 Contact Information</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Email address</li>
                      <li>Telephone number</li>
                      <li>Billing and correspondence address</li>
                    </ul>

                    <p className='text-base font-semibold text-gray-900 mt-4'>4.3 Financial and Transactional Data</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Payment confirmation details</li>
                      <li>Subscription history</li>
                      <li>Products and services purchased</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-2'>
                      Please note that we do not store full payment card details. Payments are processed securely by third-party payment providers.
                    </p>

                    <p className='text-base font-semibold text-gray-900 mt-4'>4.4 Online Learning and Platform Usage Data</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Login and logout times</li>
                      <li>Pages accessed and content viewed</li>
                      <li>Quiz and mock exam attempts and results</li>
                      <li>Progress tracking and study reports</li>
                      <li>Use of study tools, flashcards, and videos</li>
                    </ul>

                    <p className='text-base font-semibold text-gray-900 mt-4'>4.5 Technical and Website Usage Data</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>IP address</li>
                      <li>Device type, browser type, operating system</li>
                      <li>Location of access</li>
                      <li>Cookies and tracking identifiers</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-2'>
                      This information helps us maintain platform security, prevent unauthorised access, and improve user experience.
                    </p>

                    <p className='text-base font-semibold text-gray-900 mt-4'>4.6 Communications and Marketing Data</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Emails and messages sent to us</li>
                      <li>Support tickets and enquiries</li>
                      <li>Marketing preferences</li>
                      <li>Feedback, reviews, and testimonials</li>
                    </ul>

                    <p className='text-base font-semibold text-gray-900 mt-4'>4.7 AI Interaction Data</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Queries submitted to Angel AI Tutor</li>
                      <li>AI-generated responses</li>
                      <li>Interaction logs used for quality assurance, safety, and improvement</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 5 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section5')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>5. How We Use Personal Information</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section5 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section5 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We use personal information responsibly and only for purposes that are lawful, fair, and transparent.
                    </p>

                    <p className='text-base font-semibold text-gray-900 mt-4'>5.1 Providing Our Services</p>
                    <p className='text-base text-gray-700 mt-2'>We use personal information to:</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Create, administer, and manage user accounts</li>
                      <li>Verify user identity and eligibility</li>
                      <li>Enrol you as an SQE candidate on the Platform</li>
                      <li>Deliver digital learning materials, mock exams, tutorials, study plans, and AI-powered tools</li>
                      <li>Track learning progress, engagement, and completion of study activities</li>
                      <li>Provide reasonable adjustments or support where disclosed by users</li>
                    </ul>

                    <p className='text-base font-semibold text-gray-900 mt-4'>5.2 Communication</p>
                    <p className='text-base text-gray-700 mt-2'>We use personal information to:</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Respond to enquiries, applications, and support requests</li>
                      <li>Communicate important service-related information (e.g. platform updates, technical notices, policy changes)</li>
                      <li>Provide information relevant to SQE preparation and study progression</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-2'>
                      These communications are considered essential to the operation of the Platform.
                    </p>

                    <p className='text-base font-semibold text-gray-900 mt-4'>5.3 Marketing and Keeping in Touch</p>
                    <p className='text-base text-gray-700 mt-2'>
                      With your consent or where permitted by law, we may use personal information to inform you about new features, courses, or resources, share study tips and guidance, and notify you of events, promotions, or offers.
                    </p>
                    <p className='text-base text-gray-700 mt-2'>
                      You may withdraw your consent or opt out of marketing communications at any time by using the unsubscribe link in our emails or by contacting us directly. Opting out will not affect essential service communications.
                    </p>

                    <p className='text-base font-semibold text-gray-900 mt-4'>5.4 Analysis and Improvement</p>
                    <p className='text-base text-gray-700 mt-2'>We may use personal information to analyse usage trends and engagement with learning content, assess the effectiveness of study tools and resources, improve platform design, content quality, and performance, and generate anonymised or aggregated reports for internal analysis.</p>
                    <p className='text-base text-gray-700 mt-2'>
                      These insights help us enhance the learning experience while protecting individual privacy.
                    </p>

                    <p className='text-base font-semibold text-gray-900 mt-4'>5.5 Transactional and Administrative Purposes</p>
                    <p className='text-base text-gray-700 mt-2'>We use personal information to:</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Process payments and manage subscriptions</li>
                      <li>Issue invoices, receipts, and confirmations</li>
                      <li>Fulfil orders for digital or physical products</li>
                      <li>Manage refunds, cancellations, and account changes</li>
                      <li>Maintain accurate financial and administrative records</li>
                    </ul>

                    <p className='text-base font-semibold text-gray-900 mt-4'>5.6 Legal, Security, and Compliance</p>
                    <p className='text-base text-gray-700 mt-2'>We use personal information to:</p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-2 space-y-1'>
                      <li>Detect, prevent, and investigate fraud or misuse</li>
                      <li>Protect our systems, users, and intellectual property</li>
                      <li>Enforce our Terms and Conditions</li>
                      <li>Comply with legal, regulatory, and contractual obligations</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 6 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section6')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>6. Lawful Bases for Processing</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section6 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section6 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We process personal data in accordance with UK GDPR using the following lawful bases:
                    </p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-4 space-y-2'>
                      <li><b>Contractual necessity</b> – where processing is required to provide services you have requested or purchased</li>
                      <li><b>Consent</b> – where you have given clear permission (e.g. marketing communications, non-essential cookies)</li>
                      <li><b>Legitimate interests</b> – where processing is necessary to operate, improve, and secure the Platform, provided those interests do not override your rights</li>
                      <li><b>Legal obligation</b> – where processing is required by law, regulation, or legal process</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 7 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section7')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>7. Call Recording</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section7 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section7 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We may record telephone calls or other audio communications for the purposes of staff training and quality assurance, service improvement and dispute resolution, and protecting our legal rights.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Where calls are recorded, this will be clearly announced at the beginning of the call. If you do not wish to be recorded, you may inform us and we will offer an alternative communication method where reasonably possible.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Recordings are stored securely and retained for a maximum of two years, unless a longer retention period is required for legal or regulatory reasons.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 8 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section8')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>8. Disclosure of Personal Information</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section8 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section8 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We may disclose personal information to:
                    </p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-4 space-y-2'>
                      <li>Trusted third-party service providers and subcontractors who assist us in operating the Platform (including hosting, analytics, payment processing, customer support, and IT services)</li>
                      <li>Professional advisers such as legal, accounting, and audit providers</li>
                      <li>Regulators, courts, or law enforcement authorities where required or permitted by law</li>
                      <li>Third parties where you have provided explicit consent</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      All third parties are required to process personal data securely, confidentially, and only in accordance with our instructions and applicable data protection laws.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      We do not sell personal data to third parties.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 9 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section9')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>9. Sale, Merger, or Reorganisation</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section9 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section9 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      In the event of a sale, merger, reorganisation, or transfer of assets, personal information may be transferred as part of that transaction. Any such transfer will be subject to appropriate confidentiality and data protection safeguards.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 10 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section10')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>10. Data Security</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section10 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section10 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We implement appropriate physical, technical, and organisational measures to safeguard personal information, including:
                    </p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-4 space-y-1'>
                      <li>Secure servers and infrastructure</li>
                      <li>Role-based access controls</li>
                      <li>Encryption and secure transmission protocols where appropriate</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      While we take reasonable steps to protect your data, no method of transmission over the internet or electronic storage is completely secure. Any transmission of personal information is at your own risk.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 11 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section11')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>11. Data Retention</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section11 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section11 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We retain personal data only for as long as necessary to fulfil the purposes outlined in this Privacy Policy, including legal, accounting, and regulatory requirements.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Where processing is based on consent (e.g. marketing), personal data is retained until consent is withdrawn or the data is no longer required.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 12 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section12')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>12. Your Rights</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section12 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section12 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Under UK GDPR, you have the right to:
                    </p>
                    <ul className='list-disc list-inside text-base text-gray-700 mt-4 space-y-2'>
                      <li>Request access to your personal data</li>
                      <li>Request correction of inaccurate or incomplete data</li>
                      <li>Request erasure of your personal data</li>
                      <li>Restrict or object to processing in certain circumstances</li>
                      <li>Request data portability</li>
                      <li>Withdraw consent at any time</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      To exercise your rights, please contact us using the details below. We may request proof of identity before responding to ensure your data is protected.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 13 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section13')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>13. Complaints</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section13 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section13 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      If you are dissatisfied with how we handle your personal data, you have the right to lodge a complaint with the Information Commissioner's Office (ICO).
                    </p>
                  </div>
                )}
              </div>

              {/* Section 14 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section14')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>14. Children's Data</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section14 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section14 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Our services are intended for adults. We do not knowingly collect or process personal data relating to individuals under the age of 18.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 15 */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('section15')}
                  className='w-full text-left p-4 cursor-pointer bg-white border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>15. Contact Us</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.section15 ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections.section15 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      For privacy-related questions, requests, or complaints, please contact:
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Email:</b> contact@lawangelsuk.com
                    </p>
                    <p className='text-base text-gray-700 mt-2'>
                      <b>Partnerships:</b> partnerships@lawangelsuk.com
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className='md:hidden px-4 py-8'>
          <h1 className='text-3xl font-bold font-crimson text-gray-900 mb-2'>Privacy Policy</h1>
          <p className='text-sm text-gray-600 mb-6'>Last updated: 20 December 2025</p>
          <p className='text-base text-gray-700 mb-6'>
            At Law Angels, we are committed to protecting your privacy and handling your personal information fairly, transparently, and securely.
          </p>

          {/* Mobile Accordions */}
          <div className="space-y-4">
            {/* Section 1 Mobile */}
            <div className='bg-white rounded-lg border border-gray-300'>
              <button
                onClick={() => toggleSection('section1')}
                className='w-full text-left p-4 cursor-pointer'
              >
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold font-crimson'>1. Introduction</h3>
                  <span className='text-xl font-bold text-gray-600'>
                    {openSections.section1 ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openSections.section1 && (
                <div className='p-4 pt-0 text-sm text-gray-700 space-y-3'>
                  <p>We are Law Angels Limited, the Data Controller for your personal data under UK GDPR and the Data Protection Act 2018.</p>
                  <p>We are committed to protecting your privacy and handling your personal information fairly, transparently, and securely.</p>
                  <p>By providing your personal information to us, you agree to the processing of your personal data as described in this Privacy Policy.</p>
                </div>
              )}
            </div>

            {/* Section 2 Mobile */}
            <div className='bg-white rounded-lg border border-gray-300'>
              <button
                onClick={() => toggleSection('section2')}
                className='w-full text-left p-4 cursor-pointer'
              >
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold font-crimson'>2. What Is Personal Information</h3>
                  <span className='text-xl font-bold text-gray-600'>
                    {openSections.section2 ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openSections.section2 && (
                <div className='p-4 pt-0 text-sm text-gray-700 space-y-3'>
                  <p>Personal information includes any information relating to an identified or identifiable individual, such as your name, contact details, online identifiers, and study-related data.</p>
                </div>
              )}
            </div>

            {/* Section 3 Mobile */}
            <div className='bg-white rounded-lg border border-gray-300'>
              <button
                onClick={() => toggleSection('section3')}
                className='w-full text-left p-4 cursor-pointer'
              >
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-semibold font-crimson'>3. How We Collect Information</h3>
                  <span className='text-xl font-bold text-gray-600'>
                    {openSections.section3 ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openSections.section3 && (
                <div className='p-4 pt-0 text-sm text-gray-700 space-y-3'>
                  <p>We collect personal information directly from you, automatically through your use of our website and platform, and from third parties you have authorised.</p>
                </div>
              )}
            </div>

            {/* Remaining sections for mobile - abbreviated */}
            {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
              <div key={num} className='bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection(`section${num}` as keyof typeof openSections)}
                  className='w-full text-left p-4 cursor-pointer'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-lg font-semibold font-crimson'>
                      {num === 4 && '4. Categories of Information'}
                      {num === 5 && '5. How We Use Information'}
                      {num === 6 && '6. Lawful Bases'}
                      {num === 7 && '7. Call Recording'}
                      {num === 8 && '8. Disclosure of Information'}
                      {num === 9 && '9. Sale or Merger'}
                      {num === 10 && '10. Data Security'}
                      {num === 11 && '11. Data Retention'}
                      {num === 12 && '12. Your Rights'}
                      {num === 13 && '13. Complaints'}
                      {num === 14 && '14. Children\'s Data'}
                      {num === 15 && '15. Contact Us'}
                    </h3>
                    <span className='text-xl font-bold text-gray-600'>
                      {openSections[`section${num}` as keyof typeof openSections] ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {openSections[`section${num}` as keyof typeof openSections] && (
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
