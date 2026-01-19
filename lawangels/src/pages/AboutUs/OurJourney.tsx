import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function OurJourney() {
  const [openSections, setOpenSections] = useState({
    community: false,
    designed: false,
    features: false,
    platform: false,
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

        {/* Desktop / Tablet layout */}
        <div className='hidden md:block'>
          <div className='relative flex bg-[#1A1D3E] max-w-[1200px] mx-auto justify-center m-auto mt-28 rounded-2xl h-[184px] shadow-[-7px_9px_17.3px_2px_#44444447]'>
            <div className='absolute left-4 top-3 font-normal text-white text-normal'>
              About Us {'>'}
            </div>
            <div className='absolute right-8 top-12 text-white my-auto'>
              <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M35.8314 5.87032C39.0592 -1.95676 50.1451 -1.95676 53.3729 5.87032C55.3748 10.7249 60.9395 13.0299 65.7878 11.0128C73.6048 7.76059 81.4437 15.5995 78.1915 23.4164C76.1744 28.2648 78.4793 33.8294 83.334 35.8314C91.161 39.0592 91.161 50.1451 83.334 53.3729C78.4793 55.3748 76.1744 60.9395 78.1915 65.7878C81.4437 73.6048 73.6048 81.4437 65.7878 78.1915C60.9395 76.1744 55.3748 78.4793 53.3729 83.334C50.1451 91.161 39.0592 91.161 35.8314 83.334C33.8294 78.4793 28.2648 76.1744 23.4164 78.1915C15.5995 81.4437 7.76059 73.6048 11.0128 65.7878C13.0299 60.9395 10.7249 55.3748 5.87032 53.3729C-1.95676 50.1451 -1.95676 39.0592 5.87032 35.8314C10.7249 33.8294 13.0299 28.2648 11.0128 23.4164C7.76059 15.5995 15.5995 7.76059 23.4164 11.0128C28.2648 13.0299 33.8294 10.7249 35.8314 5.87032Z" fill="#4F5770" />
              </svg>
            </div>
            <div className='absolute left-7 bottom-11 font-[500] text-white text-[40px] font-crimson'>Who We Are</div>
          </div>

          <div className='text-lg max-w-[1000px] mx-auto'>
            <p className='mt-10'>
              At Law Angels, we believe that no one should walk the SQE journey alone.
            </p>
          </div>

          <div className='flex max-w-[1200px] mx-auto mt-10 mb-20 items-start gap-8'>
            {/* Left column */}
            <div className='w-9/12'>
              <p className='text-base mt-7'>
                Becoming a solicitor is not just an academic challenge, it's an emotional one. It requires resilience, confidence, and the reassurance that someone genuinely cares about your success. That belief sits at the heart of everything we do.
              </p>
              <p className='text-base mt-7'>
                Law Angels is a top UK SQE course provider, built by a community of experienced solicitors, legal experts, and education specialists who understand both the law and the learner. Many of us have been where you are now. We know the pressure, the self-doubt, the long nights, and we know how much the right support can change everything.
              </p>

              <h3 className='text-2xl font-semibold mt-10 font-crimson'>A Community That Truly Cares</h3>
              <p className='text-base mt-7'>
                Our students often tell us the same thing: "I felt supported." Candidates consistently speak about the sincerity, care, and personal attention they experience on our platform. That matters to us because success is not just about passing exams, it's about feeling confident, seen, and believed in along the way. At Law Angels, you are never just a number. Your struggles matter, your success matters.
              </p>

              <h3 className='text-2xl font-semibold mt-10 font-crimson'>Designed With Your Success in Mind</h3>
              <p className='text-base mt-7'>
                Every feature on our platform has been thoughtfully created to support different learning styles, build confidence, and help you progress at a pace that works for you. We focus not only on what you need to learn, but how you learn best.
              </p>

              <h4 className='text-xl font-semibold mt-7 pb-4 border-b-2 border-[#0089FF]'>Features That Power Your SQE Success:</h4>
              <ul className='text-base mt-7 space-y-2'>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>Comprehensive textbooks with integrated audio readers</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>Clear, concise summary notes</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>Professionally designed, high-quality flashcards</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>20 full mock exams with speed reader functionality (to master time management)</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>Progress tracker and detailed study reports</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>1,000+ animated practice questions</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>100+ Tutorial videos</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>Personalised study plans</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>Practical SQE tips and guidance</span>
                </li>
                <li className='flex items-start'>
                  <span className='mr-3'>•</span>
                  <span>Angel AI Tutor (support when you need it most)</span>
                </li>
              </ul>

              <h3 className='text-2xl font-semibold mt-10 font-crimson'>More Than a Platform</h3>
              <p className='text-base mt-7'>
                Law Angels is more than a course provider. It is a place where ambition is nurtured, confidence is built, and futures are shaped with care. We are deeply invested in the people who trust us with their SQE journey, and we take that responsibility seriously.
              </p>
              <p className='text-base mt-7 pb-7'>
                When you join Law Angels, you're not just preparing for an exam, you're joining a community that believes in you, supports you, and walks beside you until success is achieved.
              </p>
              <p className='text-base pb-7 border-b-2 border-[#0089FF]'>
                <span className='font-semibold'>Because at Law Angels, your success is personal.</span>
              </p>
            </div>

            {/* Right Sidebar */}
            <aside className='w-3/12 bg-white rounded-2xl border border-[#0089FF] shadow-lg p-6 flex flex-col'>
              <div className='text-sm font-normal text-gray-700 mb-5'>
                Subscribe for exclusive study planners, mock exams, and a network to guide you every step of the way!
              </div>
              <div className='w-full'>
                <button className='w-full bg-[#0089FF] text-white rounded-lg py-2'>
                  Subscribe
                </button>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile layout */}
        <div className='md:hidden px-4 mt-20'>
          <div className='bg-[#1A1D3E] rounded-2xl mt-4 p-5 shadow-md'>
            <div className='text-sm text-white mb-2'>About Us {'>'}</div>
            <h2 className='text-xl font-semibold text-white font-crimson'>Who We Are</h2>
          </div>

          <div className='max-w-[720px] mx-auto mt-6 text-sm text-black'>
            <p>At Law Angels, we believe that no one should walk the SQE journey alone.</p>
          </div>

          <div className='max-w-[720px] mx-auto mt-6 space-y-4'>
            <div>
              <p className='text-sm'>
                Becoming a solicitor is not just an academic challenge, it's an emotional one. It requires resilience, confidence, and the reassurance that someone genuinely cares about your success. That belief sits at the heart of everything we do.
              </p>
              <p className='text-sm mt-4'>
                Law Angels is a top UK SQE course provider, built by a community of experienced solicitors, legal experts, and education specialists who understand both the law and the learner.
              </p>
            </div>

            <div className='mb-4 bg-white rounded-lg border border-gray-300'>
              <button
                onClick={() => toggleSection('community')}
                className='w-full text-left p-4 cursor-pointer bg-white rounded-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
              >
                <div className='flex items-center justify-between'>
                  <h4 className='font-semibold text-sm'>A Community That Truly Cares</h4>
                  <span className='text-lg font-bold text-gray-600'>
                    {openSections.community ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openSections.community && (
                <div className='p-4 pt-0'>
                  <p className='text-sm text-gray-700 mt-4'>
                    Our students often tell us the same thing: "I felt supported." Candidates consistently speak about the sincerity, care, and personal attention they experience on our platform. That matters to us because success is not just about passing exams, it's about feeling confident, seen, and believed in along the way. At Law Angels, you are never just a number. Your struggles matter, your success matters.
                  </p>
                </div>
              )}
            </div>

            <div className='mb-4 bg-white rounded-lg border border-gray-300'>
              <button
                onClick={() => toggleSection('designed')}
                className='w-full text-left p-4 cursor-pointer bg-white rounded-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
              >
                <div className='flex items-center justify-between'>
                  <h4 className='font-semibold text-sm'>Designed With Your Success in Mind</h4>
                  <span className='text-lg font-bold text-gray-600'>
                    {openSections.designed ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openSections.designed && (
                <div className='p-4 pt-0'>
                  <p className='text-sm text-gray-700 mt-4'>
                    Every feature on our platform has been thoughtfully created to support different learning styles, build confidence, and help you progress at a pace that works for you. We focus not only on what you need to learn, but how you learn best.
                  </p>
                </div>
              )}
            </div>

            <div className='mb-4 bg-white rounded-lg border border-gray-300'>
              <button
                onClick={() => toggleSection('features')}
                className='w-full text-left p-4 cursor-pointer bg-white rounded-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
              >
                <div className='flex items-center justify-between'>
                  <h4 className='font-semibold text-sm'>Features That Power Your SQE Success</h4>
                  <span className='text-lg font-bold text-gray-600'>
                    {openSections.features ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openSections.features && (
                <div className='p-4 pt-0'>
                  <ul className='text-sm space-y-2 mt-4'>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>Comprehensive textbooks with integrated audio readers</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>Clear, concise summary notes</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>Professionally designed, high-quality flashcards</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>20 full mock exams with speed reader functionality</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>Progress tracker and detailed study reports</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>1,000+ animated practice questions</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>100+ Tutorial videos</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>Personalised study plans</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>Practical SQE tips and guidance</span>
                    </li>
                    <li className='flex items-start'>
                      <span className='mr-3'>•</span>
                      <span>Angel AI Tutor (support when you need it most)</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className='mb-4 bg-white rounded-lg border border-gray-300'>
              <button
                onClick={() => toggleSection('platform')}
                className='w-full text-left p-4 cursor-pointer bg-white rounded-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
              >
                <div className='flex items-center justify-between'>
                  <h4 className='font-semibold text-sm'>More Than a Platform</h4>
                  <span className='text-lg font-bold text-gray-600'>
                    {openSections.platform ? '−' : '+'}
                  </span>
                </div>
              </button>
              {openSections.platform && (
                <div className='p-4 pt-0'>
                  <p className='text-sm text-gray-700 mt-4'>
                    Law Angels is more than a course provider. It is a place where ambition is nurtured, confidence is built, and futures are shaped with care. We are deeply invested in the people who trust us with their SQE journey, and we take that responsibility seriously.
                  </p>
                  <p className='text-sm text-gray-700 mt-3'>
                    When you join Law Angels, you're not just preparing for an exam, you're joining a community that believes in you, supports you, and walks beside you until success is achieved.
                  </p>
                  <p className='text-sm font-semibold text-gray-700 mt-3'>
                    Because at Law Angels, your success is personal.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className='w-full bg-white rounded-2xl border border-[#0089FF] shadow-lg p-4 mt-6 mb-4'>
            <p className='text-sm text-gray-700'>Subscribe for exclusive study planners, mock exams, and a network to guide you every step of the way!</p>
            <button className='w-full bg-[#0089FF] text-white rounded-lg py-2 mt-4'>Subscribe</button>
          </aside>
        </div>

        <Footer />
      </div>
    </>
  )
}
