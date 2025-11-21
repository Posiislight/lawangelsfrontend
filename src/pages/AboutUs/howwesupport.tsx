import { useState } from 'react'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const testimonials = [
  {
    quote: 'Custom Tools:',
    name: 'Planners and mocks for all backgrounds',
    role: 'Simon Burn Solicitors',
  },
  {
    quote: 'Cost:',
    name: 'Our pricing is affordable',
    role: 'Simon Burn Solicitors',
  },
  {
    quote: 'Timeless Resources:',
    name: 'Updated for SRA changes',
    role: 'Simon Burn Solicitors',
  },
];

export default function PathToQualification(){
  const [openSections, setOpenSections] = useState({
    tailored: true,
    realistic: false,
    expert: false,
    affordable: false,
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
<path d="M35.8314 5.87032C39.0592 -1.95676 50.1451 -1.95676 53.3729 5.87032C55.3748 10.7249 60.9395 13.0299 65.7878 11.0128C73.6048 7.76059 81.4437 15.5995 78.1915 23.4164C76.1744 28.2648 78.4793 33.8294 83.334 35.8314C91.161 39.0592 91.161 50.1451 83.334 53.3729C78.4793 55.3748 76.1744 60.9395 78.1915 65.7878C81.4437 73.6048 73.6048 81.4437 65.7878 78.1915C60.9395 76.1744 55.3748 78.4793 53.3729 83.334C50.1451 91.161 39.0592 91.161 35.8314 83.334C33.8294 78.4793 28.2648 76.1744 23.4164 78.1915C15.5995 81.4437 7.76059 73.6048 11.0128 65.7878C13.0299 60.9395 10.7249 55.3748 5.87032 53.3729C-1.95676 50.1451 -1.95676 39.0592 5.87032 35.8314C10.7249 33.8294 13.0299 28.2648 11.0128 23.4164C7.76059 15.5995 15.5995 7.76059 23.4164 11.0128C28.2648 13.0299 33.8294 10.7249 35.8314 5.87032Z" fill="#4F5770"/>
</svg>

            </div>
            <div className='absolute left-7 bottom-11 font-[500] text-white text-[40px] font-crimson'>How We Support Your SQE1 Journey</div>
          </div>

          <div className='max-w-[1000px] mx-auto mt-10 text-lg'>
            <p>At LAWANGELS, we’re your dedicated partner for conquering the Solicitors Qualifying Examination (SQE1), the first step to becoming a solicitor in England and Wales</p>
          </div>
          <div className='max-w-[1000px] mx-auto mt-10 text-lg'>
            <p>Whether you’re a law graduate, career changer, or overseas lawyer, our tailored SQE1 resources like study planners, mock exams, and textbooks empower you to ace the exam’s challenging multiple-choice questions (50-60% pass rate). Designed to stay relevant for years, our tools align with the SRA’s stable framework.</p>
          </div>


          <div className='flex max-w-[1200px] mx-auto mt-10 mb-20 items-start gap-8'>
            <div className='w-9/12'>
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('tailored')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-normal font-crimson'>Tailored Study Plans</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.tailored ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Custom study schedules for your background: law grad, non-lawyer, or overseas professional.
                  </p>
                </button>
                {openSections.tailored && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      We create custom study schedules for your background; law grad, non-lawyer, or overseas professional. Our plans cover SQE1's broad syllabus (contracts, torts, ethics) fitting full-time or part-time study.
                    </p>
                  </div>
                )}
              </div>
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('realistic')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-normal font-crimson'>Realistic Mock Exams</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.realistic ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    SQE1 multiple-choice questions and full-length mocks that mimic the real exam.
                  </p>
                </button>
                {openSections.realistic && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Our SQE1 multiple-choice questions and full-length mocks mimic the real exam, helping you master time management. AI-driven feedback pinpoints weaknesses like ethics or trusts. Join for unlimited mocks to boost confidence and pass rates.
                    </p>
                  </div>
                )}
              </div>
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('expert')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-normal font-crimson'>Expert Resources</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.expert ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Video tutorials and flashcards for tricky topics with practical application.
                  </p>
                </button>
                {openSections.expert && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      Access concise video tutorials and flashcards for tricky topics. Our materials break down complex concepts, ensuring you apply knowledge practically, as SQE1 demands. Subscribe for tutorials and practice questions to stay exam-ready
                    </p>
                  </div>
                )}
              </div>
              <div className='mb-8 bg-white rounded-lg border border-gray-300'>
                <button
                  onClick={() => toggleSection('affordable')}
                  className='w-full text-left p-4 cursor-pointer bg-white rounded-t-lg border-0 outline-none focus:outline-none focus:ring-0 focus:border-0'
                >
                  <div className='flex items-center justify-between'>
                    <h3 className='text-2xl font-normal font-crimson'>Affordable Prep & Funding</h3>
                    <span className='text-2xl font-bold text-gray-600 ml-4'>
                      {openSections.affordable ? '−' : '+'}
                    </span>
                  </div>
                  <p className='text-base text-gray-700 mt-2'>
                    Budget-friendly SQE1 preparation resources and support.
                  </p>
                </button>
                {openSections.affordable && (
                  <div className='p-4 pt-0'>
                    <p className='text-base text-gray-700 mt-4'>
                      SQE1 costs (~£1,934) and prep (£1,500-£5,000) add up, but we keep it budget-friendly.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <aside className='w-3/12 bg-white rounded-2xl border border-[#0089FF] shadow-lg p-6 flex flex-col'>
              <div className='w-full mb-5 overflow-hidden rounded-lg'>
                <img src='#' alt='visual' className='w-full h-40 object-cover' />
              </div>
              <div className='text-sm text-gray-700 mb-5'>Subscribe for study planners, sample MCQs and exam tips.</div>
              <div className='w-full'>
                <button className='w-full bg-[#0089FF] text-white rounded-lg py-2'>Subscribe</button>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile layout */}
        <div className='md:hidden px-4 mt-20'>
          <div className='bg-orange-500 rounded-2xl mt-4 p-5 shadow-md'>
            <div className='text-sm text-white mb-2'> About Us {'>'} </div>
            <h2 className='text-xl font-semibold text-white'>Path to Qualification</h2>
          </div>

          <div className='max-w-[720px] mx-auto mt-6 text-sm text-black'>
            <p>Below is a concise guide to qualifying as a solicitor via the SQE route.</p>
          </div>

          <div className='max-w-[720px] mx-auto mt-6 space-y-6 text-black'>
            <div>
              <h4 className='font-semibold'>Step 1: Meet the Eligibility Requirements</h4>
              <p className='text-sm mt-2'>Check your prior qualifications and exemptions.</p>
            </div>
            <div className='text-black'>
              <h4 className='font-semibold'>Step 2: Pass SQE1</h4>
              <p className='text-sm mt-2'>Master the multiple-choice legal knowledge assessments.</p>
            </div>
            <div className='text-black'>
              <h4 className='font-semibold'>Step 3: Complete QWE</h4>
              <p className='text-sm mt-2'>Gain practice experience under qualified supervisors.</p>
            </div>
            <div className='text-black'>
              <h4 className='font-semibold'>Step 4: Pass SQE2</h4>
              <p className='text-sm mt-2'>Showcase practical legal skills.</p>
            </div>
          </div>

          <aside className='w-full bg-white rounded-2xl border border-orange-500 shadow-lg p-4 mt-6 mb-4'>
            <div className='w-full h-36 bg-gray-100 mb-4' />
            <p className='text-sm text-gray-700'>Subscribe for study planners, sample MCQs and exam tips.</p>
            <button className='w-full bg-orange-500 text-white rounded-lg py-2 mt-4'>Subscribe</button>
          </aside>
        </div>
        <section className="py-20 bg-gray-100 font-worksans">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <h2 className="mt-2 text-3xl md:text-5xl font-semibold text-slate-800 leading-tight">
            Why LAWANGELS?
          </h2>
          <div className="text-normal text-gray-500 mt-5">LAWANGELS delivers SRA-aligned SQE1 prep with:</div>
          
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md px-8 py-10 text-center">
              <p className="text-orange-500  text-lg">{t.quote}</p>
              <div className="mt-6 font-normal text-slate-600">{t.name}</div>
              
            </div>
          ))}
        </div>
      </div>
    </section>
        <Footer />
      </div>
    </>
  )
}
