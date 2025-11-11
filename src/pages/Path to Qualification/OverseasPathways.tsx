import { useState } from 'react'
import Navbar from '../../components/Navbar'
import CTA from '../../components/CTA'
import Footer from '../../components/Footer'

export default function OverseasPathways() {
  const [openSections, setOpenSections] = useState({
    understanding: true,
    eligibility: false,
    application: false,
    costs: false,
    complementary: false,
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
              Path to Qualification {'>'}
            </div>
            <div className='absolute right-9 top-2 text-white my-auto'>
              <svg width="80" height="80" viewBox="0 0 242 221" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M117.689 9.78197C123.922 -3.15436 142.721 -1.96727 147.277 11.6503L179.432 107.764C179.899 109.159 180.556 110.483 181.384 111.698L238.462 195.447C246.549 207.313 236.121 223 222.05 220.137L122.736 199.927C121.294 199.634 119.819 199.541 118.352 199.65L17.2848 207.207C2.96532 208.277 -5.40624 191.403 4.10899 180.649L71.2679 104.745C72.2427 103.643 73.0608 102.412 73.6993 101.087L117.689 9.78197Z" fill="white" fill-opacity="0.66"/>
</svg>
            </div>
            <div className='absolute left-4 bottom-10 font-[500] text-white text-[40px]'>Overseas Lawyer SQE2 Exemptions</div>
          </div>

          <div className='text-lg max-w-[1000px] mx-auto'>
            <p className='mt-10'>
              If you're a qualified lawyer from outside England and Wales, the Solicitors Qualifying Examination (SQE) offers a tailored route to become a solicitor, with the potential to skip parts of the process based on your experience. SQE2 tests real-world solicitor skills like advocacy, client interviewing, and drafting, and exemptions are granted only for those with equivalent expertise.
            </p>
            <p className='mt-10'>
              This guide focuses on how overseas lawyers can secure an SQE2 exemption, providing timeless strategies, clear examples, and actionable tips to navigate the path to qualification in England and Wales.
            </p>
          </div>

          <div className="flex max-w-[1200px] mx-auto mt-10 mb-20 items-start gap-8">
            {/* Main content */}
            <div className="w-9/12">
              {/* Understanding SQE2 Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('understanding')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-bold'>Understanding SQE2 and the Exemption Opportunity</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.understanding ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    SQE2 is the practical component assessing critical solicitor skills over five half-day sessions with exemptions available for equivalent experience.
                  </p>
                </button>
                {openSections.understanding && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      SQE2 is the practical component of the SQE, assessing skills critical to solicitor practice over five half-day sessions. It includes 15-16 stations (written and oral) testing:
                    </p>
                    <ul className='text-base text-gray-700 mt-2 ml-6 space-y-2'>
                      <li>• Client interviewing</li>
                      <li>• Advocacy</li>
                      <li>• Legal research</li>
                      <li>• Legal drafting</li>
                      <li>• Case and matter analysis</li>
                      <li>• Legal writing</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      These cover practice areas like property, litigation, business law, criminal practice, and wills. For overseas lawyers, the SRA may grant an SQE2 exemption if your professional experience demonstrates equivalent skills, saving you time and costs.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>The Value of an Exemption:</b> An SQE2 exemption is valuable, as it lets you skip a demanding, multi-day exam. For example, a US litigator with extensive courtroom experience might bypass SQE2, focusing only on SQE1 or QWE if needed. The SRA's flexible framework ensures fairness across jurisdictions, adapting to global legal trends.
                    </p>
                  </div>
                )}
              </div>

              {/* Eligibility Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('eligibility')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-bold'>Who Qualifies for an SQE2 Exemption?</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.eligibility ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    The SRA evaluates qualifications and experience to determine if they match SQE2's competencies through case-by-case assessment.
                  </p>
                </button>
                {openSections.eligibility && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      To secure an SQE2 exemption, you must demonstrate:
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>1. Professional Qualification:</b> You're a qualified lawyer in a recognized jurisdiction (e.g., barrister, attorney, or advocate in Australia, US, India, etc.).
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>2. Equivalent Skills:</b> Your experience covers SQE2 skills (e.g., advocacy, drafting, client interaction) at a level comparable to a newly qualified solicitor in England and Wales.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>3. Relevant Practice Areas:</b> Your work aligns with SQE2's tested areas (property, litigation, business, etc.), ideally with some exposure to UK or common law practices.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>4. Substantial Experience:</b> Typically, at least two years of recent, hands-on legal work showing mastery of these skills.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Jurisdiction Advantage:</b> Common law jurisdictions (e.g., Australia, Ireland) have an edge due to similarities in advocacy and drafting, but civil law lawyers (e.g., France, Japan) can qualify with strong portfolios showing transferable skills.
                    </p>
                  </div>
                )}
              </div>

              {/* Application Process Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('application')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-bold'>How to Apply for an SQE2 Exemption</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.application ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    The application process requires proving your skills match the SRA's standards through documented evidence.
                  </p>
                </button>
                {openSections.application && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Step 1: Assess Eligibility</b>
                    </p>
                    <ul className='text-base text-gray-700 mt-2 ml-6 space-y-2'>
                      <li>• Use the SRA's online exemptions tool to input your qualifications and experience</li>
                      <li>• Highlight SQE2-relevant skills, such as drafting contracts or representing clients in court</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Step 2: Gather Evidence</b>
                    </p>
                    <ul className='text-base text-gray-700 mt-2 ml-6 space-y-2'>
                      <li>• <b>Qualifications:</b> Provide certificates of admission or Letter of good standing (e.g., bar membership, practicing license)</li>
                      <li>• <b>Work Experience:</b> Submit detailed references from employers or supervisors outlining your tasks (e.g., "drafted 50+ contracts annually" or "conducted 20 client interviews monthly")</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Step 3: Submit Application</b>
                    </p>
                    <ul className='text-base text-gray-700 mt-2 ml-6 space-y-2'>
                      <li>• File through the SRA's mySRA portal, uploading all documents</li>
                      <li>• Fees are typically £100-£200 per exemption application (check the SRA website for current rates)</li>
                      <li>• Processing takes 3-6 months, so apply well before your planned admission date</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Step 4: Follow Up</b>
                    </p>
                    <ul className='text-base text-gray-700 mt-2 ml-6 space-y-2'>
                      <li>• The SRA may request additional evidence to clarify your skills</li>
                      <li>• Respond promptly to avoid delays</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Costs Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('costs')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-bold'>Costs and Funding for Exemption Applications</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.costs ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Understand the financial considerations and potential savings with an SQE2 exemption.
                  </p>
                </button>
                {openSections.costs && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Application Fees:</b> £100-£200 per exemption (subject to SRA updates).
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Exam Fees (If Exemption Denied):</b> SQE2 costs approximately £2,765, so securing an exemption saves significantly.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Financial Strategy:</b> The upfront cost of an exemption application is modest compared to the potential savings. If you're confident in your qualifications, applying for an exemption is a cost-effective decision. Even if denied, you can proceed with the full SQE2 exam knowing you've explored all options.
                    </p>
                  </div>
                )}
              </div>

              {/* Complementary Steps Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('complementary')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-bold'>Complementary Steps to Qualification</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.complementary ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Even with an SQE2 exemption, additional requirements ensure you meet full qualification standards.
                  </p>
                </button>
                {openSections.complementary && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Even with an SQE2 exemption, you'll need to complete:
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>SQE1 (If Not Exempt):</b> Tests legal knowledge across all major practice areas. SQE1 is often required for civil law lawyers or those seeking additional validation. It involves two days of multiple-choice questions testing functioning legal knowledge.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Qualifying Work Experience (QWE):</b> Two years of hands-on legal work demonstrating real-world skills. QWE can be completed before, during, or after exams and can span multiple organizations or jurisdictions.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Character and Suitability Check:</b> The SRA's ethical review, requiring disclosures of any issues. This applies to all candidates, regardless of exemptions, ensuring professional standards.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Final Thoughts:</b> The SRA's exemption process is fair and designed to adapt to evolving global legal standards. By demonstrating equivalent skills, overseas lawyers can integrate into the English legal profession efficiently, building on their international expertise.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="w-3/12 bg-white rounded-2xl border border-[#0089FF] shadow-lg p-6 flex flex-col">
              <div className="w-full mb-5">
                <img
                  src="#"
                  alt="visual"
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
              <div className="text-sm font-normal text-gray-700 mb-5">
                Navigating the overseas lawyer pathway to qualification? Subscribe to get expert guidance on SQE exemptions, application strategies, and exclusive resources tailored for international lawyers.
              </div>
              <div className="w-full">
                <button className="w-full bg-[#0089FF] text-white rounded-lg py-2">
                  Subscribe
                </button>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden px-4 mt-20">
          <div className="bg-[#0089FF] rounded-2xl mt-8 p-5 shadow-md">
            <div className="text-sm text-white mb-2">
              Path to Qualification {'>'}
            </div>
            <h2 className="text-xl font-semibold text-white">SQE2 Exemptions for Overseas Lawyers</h2>
          </div>

          <div className="max-w-[720px] mx-auto mt-6 space-y-4">
            {/* Understanding Mobile */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleSection('understanding')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Understanding SQE2 & Exemptions</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSections.understanding ? '−' : '+'}
                </span>
              </button>
              {openSections.understanding && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    SQE2 is the practical component assessing critical solicitor skills over five half-day sessions including client interviewing, advocacy, legal research, and drafting.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    For overseas lawyers, the SRA may grant an SQE2 exemption if your professional experience demonstrates equivalent skills, saving you time and costs.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    An SQE2 exemption lets you skip a demanding, multi-day exam, allowing you to focus on other qualification requirements.
                  </p>
                </div>
              )}
            </div>

            {/* Eligibility Mobile */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleSection('eligibility')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Who Qualifies?</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSections.eligibility ? '−' : '+'}
                </span>
              </button>
              {openSections.eligibility && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    <b>Professional Qualification:</b> You must be a qualified lawyer in a recognized jurisdiction.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Equivalent Skills:</b> Your experience covers SQE2 skills at a level comparable to a newly qualified solicitor in England and Wales.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Relevant Practice:</b> Your work aligns with SQE2's tested areas like property, litigation, business, or criminal practice.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Substantial Experience:</b> At least two years of recent, hands-on legal work showing mastery.
                  </p>
                </div>
              )}
            </div>

            {/* Application Mobile */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleSection('application')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">How to Apply</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSections.application ? '−' : '+'}
                </span>
              </button>
              {openSections.application && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 font-semibold">4-Step Process:</p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>1. Assess:</b> Use the SRA's online exemptions tool
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <b>2. Gather Evidence:</b> Collect qualifications and work references
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <b>3. Submit:</b> File via SRA's mySRA portal (£100-£200 fee)
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <b>4. Follow Up:</b> Processing takes 3-6 months
                  </p>
                </div>
              )}
            </div>

            {/* Costs Mobile */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleSection('costs')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Costs & Savings</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSections.costs ? '−' : '+'}
                </span>
              </button>
              {openSections.costs && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    <b>Application Fee:</b> £100-£200
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>SQE2 Cost (If Denied):</b> ~£2,765
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    An exemption application is cost-effective compared to the potential savings of skipping SQE2 entirely.
                  </p>
                </div>
              )}
            </div>

            {/* Complementary Mobile */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleSection('complementary')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Next Steps to Qualification</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSections.complementary ? '−' : '+'}
                </span>
              </button>
              {openSections.complementary && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    <b>SQE1 (If Not Exempt):</b> Tests legal knowledge across major practice areas
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Qualifying Work Experience:</b> Two years of hands-on legal work
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Character Check:</b> The SRA's ethical review required for all candidates
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="w-full bg-white rounded-2xl border border-[#0089FF] shadow-lg p-4 mt-6 mb-4">
            <div className="w-full h-36 bg-gray-100 mb-4" />
            <p className="text-sm text-gray-700">
              Expert guidance on SQE exemptions and application strategies for international lawyers.
            </p>
            <button className="w-full bg-[#0089FF] text-white rounded-lg py-2 mt-4">
              Subscribe
            </button>
          </aside>
        </div>
        <CTA />
        <Footer />
      </div>
    </>
  );
}