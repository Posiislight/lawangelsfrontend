import { Link } from 'react-router-dom'
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
  return (
    <>
      <div className='w-full font-worksans mx-auto md:min-h-screen'>
        <Navbar />

        {/* Desktop / Tablet layout */}
        <div className='hidden md:block'>
          <div className='relative flex bg-orange-500 max-w-[1200px] mx-auto justify-center m-auto mt-28 rounded-2xl h-60 shadow-lg'>
            <div className='absolute left-4 top-3 font-normal text-white text-normal'>
              About Us {'>'}
            </div>
            <div className='absolute right-8 top-0 text-white my-auto'>
              <svg width="177" height="176" viewBox="0 0 177 176" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M80.9628 7.34234C81.8117 -1.81907 95.1883 -1.81911 96.0372 7.3423L98.257 31.2997C98.8892 38.122 107.537 40.6613 111.757 35.2638L126.577 16.3097C132.244 9.06158 143.497 16.2934 139.258 24.4594L128.174 45.8139C125.017 51.895 130.919 58.7065 137.388 56.4474L160.102 48.5144C168.788 45.4808 174.345 57.6485 166.364 62.2265L145.494 74.1981C139.551 77.6072 140.834 86.5284 147.496 88.125L170.894 93.7318C179.842 95.8759 177.938 109.116 168.749 108.653L144.719 107.44C137.876 107.095 134.132 115.294 138.874 120.239L155.526 137.606C161.894 144.247 153.134 154.356 145.655 148.998L126.095 134.987C120.525 130.997 112.943 135.87 114.259 142.594L118.878 166.206C120.645 175.236 107.81 179.004 104.415 170.453L95.5351 148.092C93.0065 141.724 83.9935 141.724 81.4649 148.092L72.5853 170.453C69.1898 179.004 56.3551 175.236 58.1216 166.206L62.7413 142.594C64.0568 135.87 56.4746 130.997 50.9047 134.987L31.3451 148.998C23.8655 154.356 15.1058 144.247 21.4736 137.606L38.1257 120.239C42.8676 115.294 39.1235 107.095 32.2807 107.44L8.25126 108.653C-0.937706 109.116 -2.84142 95.8759 6.10593 93.7318L29.5036 88.125C36.1664 86.5284 37.4491 77.6072 31.506 74.1981L10.6357 62.2265C2.65481 57.6485 8.21165 45.4808 16.8978 48.5144L39.6124 56.4474C46.0808 58.7065 51.983 51.8949 48.8264 45.8139L37.7415 24.4594C33.5026 16.2934 44.7557 9.06155 50.4229 16.3097L65.2427 35.2638C69.4629 40.6613 78.1108 38.122 78.743 31.2997L80.9628 7.34234Z" fill="white" fill-opacity="0.66"/>
</svg>
            </div>
            <div className='absolute left-4 bottom-5 font-medium text-white text-4xl'>How We Support Your SQE1 Journey</div>
          </div>

          <div className='max-w-[1000px] mx-auto mt-10 text-lg'>
            <p>At LAWANGELS, we’re your dedicated partner for conquering the Solicitors Qualifying Examination (SQE1), the first step to becoming a solicitor in England and Wales</p>
          </div>
          <div className='max-w-[1000px] mx-auto mt-10 text-lg'>
            <p>Whether you’re a law graduate, career changer, or overseas lawyer, our tailored SQE1 resources like study planners, mock exams, and textbooks empower you to ace the exam’s challenging multiple-choice questions (50-60% pass rate). Designed to stay relevant for years, our tools align with the SRA’s stable framework.</p>
          </div>


          <div className='flex max-w-[1200px] mx-auto mt-10 mb-20 items-start gap-8'>
            <div className='w-9/12'>
              <section className='mb-8 border-b-2 border-orange-500 pb-16'>
                <h3 className='text-2xl font-medium mb-3'>Tailored Study Plans</h3>
                <p className='text-base text-gray-700'>We create custom study schedules for your background; law grad, non-lawyer, or overseas professional. Our plans cover SQE1’s broad syllabus (contracts, torts, ethics) fitting full-time or part-time study.</p>
              </section>
              <section className='mb-8 border-b-2 border-orange-500 pb-16'>
                <h3 className='text-2xl font-medium mb-3'>Realistic Mock Exams</h3>
                <p className='text-base text-gray-700'>Our SQE1 multiple-choice questions and full-length mocks mimic the real exam, helping you master time management. AI-driven feedback pinpoints weaknesses like ethics or trusts. Join for unlimited mocks to boost confidence and pass rates.</p>
              </section>
              <section className='mb-8 border-b-2 border-orange-500 pb-16'>
                <h3 className='text-2xl font-medium mb-3'>Expert Resources</h3>
                <p className='text-sm text-gray-700'>Access concise video tutorials and flashcards for tricky topics. Our materials break down complex concepts, ensuring you apply knowledge practically, as SQE1 demands. Subscribe for tutorials and practice questions to stay exam-ready</p>
              </section>
              <section className='mb-8 border-b-2 border-orange-500 pb-16'>
                <h3 className='text-2xl font-medium mb-3'>Affordable Prep & Funding</h3>
                <p className='text-sm text-gray-700'>SQE1 costs (~£1,934) and prep (£1,500-£5,000) add up, but we keep it budget-friendly.</p>
              </section>
            </div>

            <aside className='w-3/12 bg-white rounded-2xl border border-orange-500 shadow-lg p-6 flex flex-col'>
              <div className='w-full mb-5 overflow-hidden rounded-lg'>
                <img src='#' alt='visual' className='w-full h-40 object-cover' />
              </div>
              <div className='text-sm text-gray-700 mb-5'>Subscribe for study planners, sample MCQs and exam tips.</div>
              <div className='w-full'>
                <button className='w-full bg-orange-500 text-white rounded-lg py-2'>Subscribe</button>
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile layout */}
        <div className='md:hidden px-4 mt-16'>
          <div className='bg-orange-500 rounded-2xl mt-4 p-5 shadow-md'>
            <div className='text-sm text-white mb-2'><Link to='/'> {'>'} Home</Link></div>
            <h2 className='text-xl font-semibold text-white'>Path to Qualification</h2>
          </div>

          <div className='max-w-[720px] mx-auto mt-6 text-sm'>
            <p>Below is a concise guide to qualifying as a solicitor via the SQE route.</p>
          </div>

          <div className='max-w-[720px] mx-auto mt-6 space-y-6'>
            <div>
              <h4 className='font-semibold'>Step 1: Meet the Eligibility Requirements</h4>
              <p className='text-sm mt-2'>Check your prior qualifications and exemptions.</p>
            </div>
            <div>
              <h4 className='font-semibold'>Step 2: Pass SQE1</h4>
              <p className='text-sm mt-2'>Master the multiple-choice legal knowledge assessments.</p>
            </div>
            <div>
              <h4 className='font-semibold'>Step 3: Complete QWE</h4>
              <p className='text-sm mt-2'>Gain practice experience under qualified supervisors.</p>
            </div>
            <div>
              <h4 className='font-semibold'>Step 4: Pass SQE2</h4>
              <p className='text-sm mt-2'>Showcase practical legal skills.</p>
            </div>
          </div>

          <aside className='w-full bg-white rounded-2xl border border-orange-500 shadow-lg p-4 mt-6'>
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
