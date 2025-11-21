import { useState } from 'react'
import Navbar from '../../components/Navbar'
import CTA from '../../components/CTA'
import Footer from '../../components/Footer'

export default function AssessmentDates() {
  const [openSections, setOpenSections] = useState({
    january: true,
    july: false,
    tips: false,
    milestones: false,
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
            <div className='absolute left-4 bottom-10 font-[500] text-white text-[40px] font-crimson'>Assessment Timeline & Key Dates for SQE 2026</div>
          </div>

          <div className='text-lg max-w-[1000px] mx-auto'>
            <p className='mt-10'>
              Planning your Solicitors Qualifying Examination (SQE) journey for 2026? Timing is everything, whether you're tackling SQE1's knowledge-based multiple-choice questions or SQE2's practical skills assessments, knowing the exact dates, booking windows, and result timelines can make or break your prep strategy.
            </p>
            <p className='mt-10'>
              The Solicitors Regulation Authority (SRA) runs SQE1 twice a year (January and July) and SQE2 four times (January, April, July, and October), giving you flexible options to fit around your Qualifying Work Experience (QWE) or studies. As of September 2025, the SRA has started publishing 2026 dates, with full details on their website for booking and locations. At Law Angels, we're committed to helping you navigate this with our expert SQE prep resources. Subscribe today for personalized timelines, mock exam schedules, and exclusive updates to keep you ahead!
            </p>
            <p className='mt-10'>
              This guide outlines the projected 2026 assessment timeline for SQE1 based on SRA patterns and early announcements. Dates are typically confirmed a few months in advance, so check the SRA site regularly for finals. We'll cover SQE1 including booking windows, exam durations, and result dates.
            </p>
          </div>

          <div className="flex max-w-[1200px] mx-auto mt-10 mb-20 items-start gap-8">
            {/* Main content */}
            <div className="w-9/12">
              <h2 className='text-3xl font-bold mb-8'>SQE1 Assessments in 2026: Building Your Legal Knowledge</h2>
              <p className='text-base text-gray-700 mb-8'>
                SQE1 consists of two exams (FLK1 and FLK2) taken over two days, testing functioning legal knowledge across areas like contracts, torts, and ethics. Each sitting lasts about five hours per day, with 180 multiple choice questions (Single Best Answer format). Expect pass rates around 50-60%, so rigorous prep is key.
              </p>

              {/* January 2026 Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('january')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-normal'>January 2026 SQE1 Sitting</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.january ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Assessment Dates: January 12–16, 2026. Booking window opens October 2025.
                  </p>
                </button>
                {openSections.january && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Assessment Dates:</b> January 12–16, 2026 (FLK1 on Day 1, FLK2 on Day 2). See sqe.sra.org.uk for more information.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Booking Window:</b> Opens October 2025; closes mid-December 2025 (aim to book by early December to secure your spot).
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Results Release:</b> Expected late March 2026 (approximately 5-6 weeks post-exam).
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Prep Insight:</b> If you are looking at taking the SQE1 exam in 2026, Our Law Angels SQE1 mocks simulate these exact formats. Subscribers get access to timed practice runs!
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Fee:</b> £1,934 (as of 2025 rates; confirm for 2026 from the SRA SQE website).
                    </p>
                  </div>
                )}
              </div>

              {/* July 2026 Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('july')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-normal'>July 2026 SQE1 Sitting</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.july ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Assessment Dates: July 13–17, 2026. Perfect for those building QWE in the first half of the year.
                  </p>
                </button>
                {openSections.july && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Assessment Dates:</b> July 13–17, 2026 (following the standard mid-July slot).
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Booking Window:</b> Opens April 2026; closes early June 2026.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Results Release:</b> Expected mid-October 2026.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Prep Insight:</b> Perfect for those building QWE in the first half of the year. At LAWANGELS, our extended part-time courses align with this, subscribe for enrollment alerts!
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Fee:</b> £1,934 (as of 2025 rates; confirm for 2026 from the SRA SQE website).
                    </p>
                  </div>
                )}
              </div>

              {/* General Tips Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('tips')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-normal'>General SQE1 Tips</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.tips ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Assessments are held at Pearson VUE test centres worldwide with flexible options.
                  </p>
                </button>
                {openSections.tips && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Assessments are held at Pearson VUE test centres worldwide. Fees for 2025/26 are £1,934 total (up from previous years), payable upon booking. You have up to six years and three attempts per stage, so if January doesn't work, July is your backup.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Pro Tips:</b>
                    </p>
                    <ul className='text-base text-gray-700 mt-2 ml-6 space-y-2'>
                      <li>• Book as soon as the window opens to secure your preferred date and location</li>
                      <li>• Start prep at least 3 months before your target sitting</li>
                      <li>• Use our Law Angels mocks to practice under exam conditions</li>
                      <li>• Plan your QWE around exam dates for optimal balance</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Key Milestones Accordion */}
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('milestones')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-normal'>Key Milestones Beyond Assessments</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.milestones ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Important timelines from registration through to admission as a solicitor.
                  </p>
                </button>
                {openSections.milestones && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Registration with SRA:</b> Anytime before booking, verify ID and request adjustments early.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>QWE Confirmation:</b> Complete 2 years before admission; get it signed off post-SQE2.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Character & Suitability Check:</b> Apply after passing both SQEs.
                    </p>
                    <p className='text-base text-gray-700 mt-4'>
                      <b>Admission as Solicitor:</b> Upon SRA approval, typically 1-2 months after results.
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
                Stay ahead of your SQE1 timeline! Subscribe to our comprehensive exam prep resources, including personalized timelines, mock exam schedules, and exclusive updates.
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
            <h2 className="text-xl font-semibold text-white">Assessment Timeline 2026</h2>
          </div>

          <div className="max-w-[720px] mx-auto mt-6 space-y-4">
            {/* January Mobile */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleSection('january')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">January 2026 SQE1</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSections.january ? '−' : '+'}
                </span>
              </button>
              {openSections.january && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    <b>Assessment Dates:</b> January 12–16, 2026
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Booking Window:</b> October - mid-December 2025
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Results:</b> Late March 2026
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Fee:</b> £1,934
                  </p>
                </div>
              )}
            </div>

            {/* July Mobile */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleSection('july')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">July 2026 SQE1</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSections.july ? '−' : '+'}
                </span>
              </button>
              {openSections.july && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    <b>Assessment Dates:</b> July 13–17, 2026
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Booking Window:</b> April - early June 2026
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Results:</b> Mid-October 2026
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    <b>Fee:</b> £1,934
                  </p>
                </div>
              )}
            </div>

            {/* Tips Mobile */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleSection('tips')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">General SQE1 Tips</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSections.tips ? '−' : '+'}
                </span>
              </button>
              {openSections.tips && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700">
                    Assessments at Pearson VUE centres worldwide. You have up to six years and three attempts per stage.
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Start prep 3 months before your target sitting and use our Law Angels mocks to practice under exam conditions.
                  </p>
                </div>
              )}
            </div>

            {/* Milestones Mobile */}
            <div className="bg-white rounded-lg p-4">
              <button
                onClick={() => toggleSection('milestones')}
                className="w-full flex items-center justify-between text-left"
              >
                <h4 className="font-bold">Key Milestones</h4>
                <span className="text-xl font-bold text-gray-600 ml-2">
                  {openSections.milestones ? '−' : '+'}
                </span>
              </button>
              {openSections.milestones && (
                <div className="mt-2">
                  <p className="text-sm text-gray-700 font-semibold">Important dates:</p>
                  <p className="text-sm text-gray-700 mt-2">• SRA Registration: Before booking</p>
                  <p className="text-sm text-gray-700">• QWE Confirmation: Post-SQE2</p>
                  <p className="text-sm text-gray-700">• Character Check: After both SQEs</p>
                  <p className="text-sm text-gray-700">• Admission: 1-2 months after approval</p>
                </div>
              )}
            </div>
          </div>

          <aside className="w-full bg-white rounded-2xl border border-[#0089FF] shadow-lg p-4 mt-6 mb-4">
            <div className="w-full h-36 bg-gray-100 mb-4" />
            <p className="text-sm text-gray-700">
              Stay ahead with personalized timelines and exclusive exam prep updates.
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