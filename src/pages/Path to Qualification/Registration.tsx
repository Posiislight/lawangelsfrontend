import { useState } from 'react'
import Navbar from '../../components/Navbar'
import CTA from '../../components/CTA'
import Footer from '../../components/Footer'

export default function Registration() {
  const [openSteps, setOpenSteps] = useState({
    step1: true,
    step2: false,
    step3: false,
    costs: false,
  })

  const toggleStep = (step: keyof typeof openSteps) => {
    setOpenSteps(prev => ({
      ...prev,
      [step]: !prev[step]
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
            <div className='absolute left-4 bottom-10 font-[500] text-white text-[40px]'>Registering After You Pass and Admission</div>
          </div>

          <div className='text-lg max-w-[1000px] mx-auto'>
            <p className='mt-10'>
              Congratulations on conquering the Solicitors Qualifying Examination (SQE). Passing SQE1 and SQE2 is a huge milestone, but you're not quite a solicitor yet. The final steps—registering with the Solicitors Regulation Authority (SRA) and securing admission—require careful attention to detail to ensure a smooth transition into your legal career.
            </p>
            <p className='mt-10'>
              These steps involve confirming your Qualifying Work Experience (QWE), passing the SRA's character and suitability check, and applying for admission. At LAWANGELS, we're here to guide you through this process with expert tips, checklists, and exclusive resources to streamline your journey.
            </p>
            <p className='mt-10'>
              This guide breaks down the registration and admission process, shares practical insights, and highlights how LAW ANGELS can support you. Let's dive into what you need to do after passing the SQE to become a fully qualified solicitor in England and Wales.
            </p>
          </div>

          <div className="flex max-w-[1200px] mx-auto mt-10 mb-20 items-start gap-8">
            {/* Main content */}
            <div className="w-9/12">
              {/* Step 1 Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleStep('step1')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-bold'>Step 1: Confirm Your Qualifying Work Experience (QWE)</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSteps.step1 ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Complete and verify two years of full-time legal work experience to prove your practical solicitor skills.
                  </p>
                </button>
                {openSteps.step1 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Before you can apply for admission, you must complete and verify two years of full-time (or part-time equivalent) Qualifying Work Experience (QWE). This is a critical step, as it proves you've developed the practical skills needed to practice as a solicitor.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>What You Need:</b> Two years of experience in roles providing legal services, such as paralegal work, law clinic volunteering, or in-house legal tasks. These can be spread across up to four organizations, and part-time work counts proportionally (e.g., four years at 17.5 hours/week equals two years full-time).
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Verification Process:</b> A solicitor or compliance officer (with SRA approval) must confirm your QWE. They'll sign off on your experience, verifying it aligns with SRA competences like client communication or case handling. You don't need SRA pre-approval, but you must submit details via the SRA's online portal.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Timing:</b> You can complete QWE before, during, or after SQE exams, but it must be finalized before admission. Most candidates confirm QWE after passing SQE2 to streamline the process.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Pro Tip:</b> QWE is flexible, but accuracy is key. For example, a candidate might combine 18 months as a paralegal in a family law firm with 6 months volunteering at a pro bono clinic, covering diverse skills like drafting and advocacy.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 2 Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleStep('step2')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-bold'>Step 2: Pass the SRA Character and Suitability Check</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSteps.step2 ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Demonstrate your integrity through the SRA's character and suitability assessment.
                  </p>
                </button>
                {openSteps.step2 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      The SRA's character and suitability assessment ensures you meet the ethical standards expected of a solicitor. This step is about transparency and demonstrating your integrity.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>What's Involved:</b> You'll disclose any issues that might affect your suitability, such as criminal convictions, financial problems (e.g., bankruptcy), or academic misconduct. Minor issues, like a speeding ticket or a one-off academic warning, won't automatically disqualify you if you show rehabilitation or context.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>How to Apply:</b> Submit your application through the SRA's online portal, including supporting documents like references or evidence of resolved issues. The SRA may request additional information or an interview for complex cases.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Timing and Duration:</b> Apply as soon as you pass SQE2 and confirm QWE, as processing can take 3-6 months.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 3 Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleStep('step3')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-bold'>Step 3: Apply for Admission as a Solicitor</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSteps.step3 ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Complete the final step to officially become a solicitor with your practising certificate.
                  </p>
                </button>
                {openSteps.step3 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Once your QWE is verified and your character check is approved, you're ready to apply for admission to the roll of solicitors, the final step to officially becoming a solicitor.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Application Process:</b> Submit your admission application via the SRA's mySRA portal. You'll need to provide:
                    </p>
                    <ul className='text-base text-gray-700 mt-2 ml-6 space-y-2'>
                      <li>• Proof of passing SQE1 and SQE2 (the SRA receives results directly from Kaplan)</li>
                      <li>• Confirmed QWE documentation, signed by your supervisor(s)</li>
                      <li>• Evidence of your degree or equivalent qualification (e.g., level 6 apprenticeship)</li>
                      <li>• Character and suitability approval (or confirmation it's in progress)</li>
                    </ul>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Timeline:</b> Admission typically takes 1-2 months after approval of all components. Once approved, you'll receive your practising certificate, allowing you to call yourself a solicitor.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Important Note:</b> This step is your victory lap, but incomplete paperwork can cause delays. Stay organized and follow up proactively.
                    </p>
                  </div>
                )}
              </div>

              {/* Costs Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleStep('costs')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-bold'>Costs and Planning for Admission</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSteps.costs ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Understand the financial considerations and support available for final registration steps.
                  </p>
                </button>
                {openSteps.costs && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>QWE Confirmation:</b> Free, but ensure supervisors are accessible—delays can occur if they're unavailable.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Character and Suitability:</b> No separate fee, but complex cases may need legal advice.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Support Available:</b> The SRA's diversity fund offers grants for disadvantaged candidates.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Planning Strategy:</b> Costs are modest compared to SQE exams, but planning ahead avoids stress. For example, saving for the admission fee during QWE is a smart move for part-time workers.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      Completing these final steps transforms your hard work into a solicitor title, opening doors to a rewarding career. Whether you're aiming for a high-street firm, in-house role, or your own practice, the SRA's checks ensure the profession upholds trust and ethics.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      But navigating forms, deadlines, and disclosures can feel daunting without support. Our platform is your partner in success, as you can get SRA announcements and case studies from recent qualifiers to guide your journey!
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
                Navigate your final steps to becoming a solicitor with confidence. Subscribe to get exclusive resources, SRA announcements, and guidance from recent qualifiers.
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
            <h2 className="text-xl font-semibold text-white">Registration & Admission</h2>
          </div>

          <div className="max-w-[720px] mx-auto mt-6 space-y-4">
            {/* Step 1 Mobile Accordion */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleStep('step1')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Step 1: Confirm Your QWE</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSteps.step1 ? '−' : '+'}
                </span>
              </button>
              {openSteps.step1 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    Complete and verify two years of full-time (or part-time equivalent) Qualifying Work Experience (QWE).
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>What You Need:</b> Two years of experience in roles providing legal services across up to four organizations.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Verification:</b> A solicitor or compliance officer must confirm your QWE via the SRA's online portal.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Timing:</b> Most candidates confirm QWE after passing SQE2 to streamline the process.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2 Mobile Accordion */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleStep('step2')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Step 2: Character & Suitability</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSteps.step2 ? '−' : '+'}
                </span>
              </button>
              {openSteps.step2 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    The SRA's character and suitability assessment ensures you meet the ethical standards expected of a solicitor.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>What's Involved:</b> Disclose any issues like criminal convictions or financial problems. Minor issues won't automatically disqualify you if you show rehabilitation.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Timeline:</b> Processing can take 3-6 months, so apply as soon as possible after passing SQE2.
                  </p>
                </div>
              )}
            </div>

            {/* Step 3 Mobile Accordion */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleStep('step3')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Step 3: Apply for Admission</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSteps.step3 ? '−' : '+'}
                </span>
              </button>
              {openSteps.step3 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    Submit your admission application via the SRA's mySRA portal.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Required Documents:</b> SQE1 & SQE2 results, QWE documentation, degree evidence, and character approval.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Timeline:</b> Admission typically takes 1-2 months. Once approved, you'll receive your practising certificate.
                  </p>
                </div>
              )}
            </div>

            {/* Costs Mobile Accordion */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleStep('costs')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Costs & Planning</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSteps.costs ? '−' : '+'}
                </span>
              </button>
              {openSteps.costs && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    <b>QWE Confirmation:</b> Free, but ensure supervisors are accessible.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Character & Suitability:</b> No separate fee, but complex cases may need legal advice.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Support Available:</b> The SRA's diversity fund offers grants for disadvantaged candidates.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Planning ahead avoids stress. Completing these final steps transforms your hard work into a solicitor title!
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="w-full bg-white rounded-2xl border border-[#0089FF] shadow-lg p-4 mt-6 mb-4">
            <div className="w-full h-36 bg-gray-100 mb-4" />
            <p className="text-sm text-gray-700">
              Navigate your final steps to becoming a solicitor with exclusive resources and SRA guidance.
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