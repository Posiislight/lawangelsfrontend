
import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'


export default function Pathtoqualify() {
  const [openSteps, setOpenSteps] = useState({
    step1: true,
    step2: false,
    step3: false,
    step4: false,
    step5: false,
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
            <div className='absolute left-4 bottom-10 font-[500] text-white text-[40px] font-crimson'>How To Qualify as a solicitor via the SQE route</div>
          </div>

          <div className='text-lg max-w-[1000px] mx-auto'>
            <p className='mt-10'>
              Becoming a solicitor in England and Wales is now more open and exciting than ever, thanks to the Solicitors Qualifying Examination (SQE) route. Launched in 2021, this pathway replaced the old Legal Practice Course (LPC) and offers a flexible, inclusive way to join the legal profession, perfect for career changers, non-law graduates, or anyone eager to qualify through diverse experiences. No more rigid training contracts; you can shape your journey while building real world skills. The SQE does come with challenges, like tough exams and the need for smart planning, but with the right preparation, it’s a game changer
            </p>
            <p className='mt-10'>
              At Law Angels, we’re here to guide you with top-notch SQE prep course content, from study tips to practice questions. Subscribe to our website for exclusive resources and stay ahead in your solicitor journey! This guide breaks down the steps, shares insider insights, and shows how Law Angels can help you succeed in your exam.
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
                    <h3 className='text-2xl font-semibold font-crimson'>Step 1: Meet the Eligibility Requirements</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSteps.step1 ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    The SQE is designed to welcome everyone, not just law graduates. Here's what you need to start:
                  </p>
                </button>
                {openSteps.step1 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                        <b>A Degree or Equivalent:</b> You need a degree (any subject) at level 6 or higher (UK qualifications framework) or equivalent experience, like a level 6 apprenticeship in business. This means your degree in art, science, or even no degree, if you've got relevant qualifications, can get you in. It's a fantastic opportunity for career switchers to break into law without starting over.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                        <b>English Language Skills:</b> If English isn't your first language, your degree or work experience usually proves your proficiency.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                        The SQE's open-door policy levels the playing field, unlike the old LPC system. International lawyers might even skip parts of the SQE (check the Solicitors Regulation Authority (SRA) exemptions tool to see if this applies to you).
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
                    <h3 className='text-2xl font-semibold font-crimson'>Step 2: Pass SQE1 – Master Your Legal Knowledge</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSteps.step2 ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    SQE1 tests your "functioning legal knowledge" with multiple-choice questions (MCQs) that mimic real-world legal scenarios. Two days, 360 MCQs, covering key legal topics.
                  </p>
                </button>
                {openSteps.step2 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>What to Expect:</b> Two days, 360 MCQs (180 per day), covering 
                      topics like contract law, tort, ethics, and business law. 
                      It's closed-book, so you need to know your stuff and 
                      apply it practically, like advising a client on a contract dispute.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>The Challenge:</b> Pass rates are around 50-60%, so preparation is 
                      critical. Questions blend law and ethics, 
                      testing your ability to think like a solicitor.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                        SQE1 isn't about memorizing textbooks, it's about applying law to client problems, reflecting modern legal practice. For example, a question might ask you to spot a legal issue in a business deal gone wrong. Subscribe to LAWANGELS for our SQE1 prep courses, including mock exams and video tutorials 
                        tailored to the SQE syllabi. Our subscribers rave 
                        about our practice questions that mirror real exam scenarios, helping you study smarter. Join today to access free sample tests!
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
                    <h3 className='text-2xl font-semibold font-crimson'>Step 3: Complete Qualifying Work Experience (QWE)</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSteps.step3 ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Gain two years of real-life legal work experience across up to four organizations. Mix and match roles like paralegal jobs, law clinic volunteering, or in-house legal tasks.
                  </p>
                </button>
                {openSteps.step3 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Say goodbye to training contracts. With QWE, you can gain two years of experience across up to four organizations and shape your own path.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                        <b>Flexibility:</b> Mix and match roles are allowed. For example, 
                        18 months as a paralegal plus 6 months in a pro bono clinic works.
                        Part-time counts proportionally
                    </p>
                  </div>
                )}
              </div>

              {/* Step 4 Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleStep('step4')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>Step 4: Pass SQE2 - Showcase Your Practical Skills</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSteps.step4 ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Prove you can act like a solicitor with hands-on assessments over five half-days, testing your practical legal skills in real-world scenarios.
                  </p>
                </button>
                {openSteps.step4 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      SQE2 is where you prove you can act like a solicitor, with hands-on assessments over five half-days
                    </p>
                  </div>
                )}
              </div>

              {/* Step 5 Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleStep('step5')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-semibold font-crimson'>Step 5: Pass the Character and Suitability Check</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSteps.step5 ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    The SRA checks your character and suitability to ensure you meet the profession's ethical standards. Be honest about any past issues and apply early.
                  </p>
                </button>
                {openSteps.step5 && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Before you're admitted as a solicitor, the SRA checks your "character and suitability" to ensure you meet the profession's ethical standards.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                        <b>What's Involved:</b> Disclose any criminal records, financial troubles, or academic issues. Honesty is key, minor issues won't always block you if you show you've moved on.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                        <b>Timing:</b> Apply early, as reviews can take months
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
                Ready to start your journey to becoming a solicitor? Subscribe to our comprehensive 
                SQE preparation resources, including study guides, mock exams, and expert support.
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
          <div className="bg-[#1A1D3E] rounded-2xl mt-8 p-5 shadow-md">
            <div className="text-sm text-white mb-2">
              Path to Qualification {'>'}
            </div>
            <h2 className="text-xl font-semibold text-white">How To Qualify As A Solicitor</h2>
          </div>

          <div className="max-w-[720px] mx-auto mt-6 space-y-4">
            {/* Step 1 Mobile Accordion */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleStep('step1')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Step 1: Meet the Eligibility Requirements</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSteps.step1 ? '−' : '+'}
                </span>
              </button>
              {openSteps.step1 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    The SQE is designed to welcome everyone, not just law graduates. Here's what you need to start:
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>A Degree or Equivalent:</b> You need a degree (any subject) at level 6 or higher (UK qualifications framework) or equivalent experience, like a level 6 apprenticeship in business.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>English Language Skills:</b> If English isn't your first language, your degree or work experience usually proves your proficiency.
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
                <h4 className="font-bold">Step 2: Pass SQE1</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSteps.step2 ? '−' : '+'}
                </span>
              </button>
              {openSteps.step2 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    SQE1 tests your "functioning legal knowledge" with multiple-choice questions (MCQs) that mimic real-world legal scenarios.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Two days, 360 MCQs (180 per day), covering topics like contract law, tort, ethics, and business law.
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
                <h4 className="font-bold">Step 3: Complete QWE</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSteps.step3 ? '−' : '+'}
                </span>
              </button>
              {openSteps.step3 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    Say goodbye to training contracts. With QWE, you can gain two years of experience across up to four organizations and shape your own path.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Any role offering "real-life" legal work, like paralegal jobs, law clinic volunteering, or in-house legal tasks qualifies.
                  </p>
                </div>
              )}
            </div>

            {/* Step 4 Mobile Accordion */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleStep('step4')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Step 4: Pass SQE2</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSteps.step4 ? '−' : '+'}
                </span>
              </button>
              {openSteps.step4 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    SQE2 is where you prove you can act like a solicitor, with hands-on assessments over five half-days.
                  </p>
                </div>
              )}
            </div>

            {/* Step 5 Mobile Accordion */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleStep('step5')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Step 5: Character Check</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSteps.step5 ? '−' : '+'}
                </span>
              </button>
              {openSteps.step5 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    Before you're admitted as a solicitor, the SRA checks your "character and suitability" to ensure you meet the profession's ethical standards.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>What's Involved:</b> Disclose any criminal records, financial troubles, or academic issues. Honesty is key, minor issues won't always block you if you show you've moved on.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Timing:</b> Apply early, as reviews can take months
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="w-full bg-white rounded-2xl border border-[#0089FF] shadow-lg p-4 mt-6 mb-4">
            <div className="w-full h-36 bg-gray-100 mb-4" />
            <p className="text-sm text-gray-700">
              Start your journey to becoming a solicitor with our comprehensive SQE preparation resources.
            </p>
            <button className="w-full bg-[#0089FF] text-white rounded-lg py-2 mt-4">
              Subscribe
            </button>
          </aside>
        </div>
        <Footer />
      </div>
    </>
  );
}