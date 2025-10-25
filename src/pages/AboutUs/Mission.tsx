
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function About() {
    
    return (
      <>
  <div className='w-full font-worksans mx-auto md:min-h-screen'>
            <Navbar />
            {/* =========================
            DESKTOP / TABLET (md and up)
            KEEP ORIGINAL LAYOUT (unchanged)
            ========================= */}
            <div className='hidden md:block'>
            <div className='relative flex  bg-[#1A1D3E]  max-w-[1200px] mx-auto justify-center m-auto mt-28 rounded-2xl h-[184px] shadow-[-7px_9px_17.3px_2px_#44444447] '>
                <div className='absolute left-4 top-3 font-normal text-white text-normal '>
                    About Us {'>'}
                </div>
                <div className='absolute right-9 top-0 text-white my-auto'>
                  {/* Explicit size + color so the icon is visible on the orange banner */}
                  <svg
        width="100"
        height="100"
        viewBox="0 0 255 255"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute right-10 top-10"
      >
        <path
          d="M102.43 16.7915C111.656 -5.58084 143.344 -5.58084 152.57 16.7915C158.292 30.6677 174.198 37.256 188.056 31.4904C210.399 22.1945 232.805 44.6007 223.51 66.9442C217.744 80.8024 224.332 96.7081 238.208 102.43C260.581 111.656 260.581 143.344 238.208 152.57C224.332 158.292 217.744 174.198 223.51 188.056C232.805 210.399 210.399 232.805 188.056 223.51C174.198 217.744 158.292 224.332 152.57 238.208C143.344 260.581 111.656 260.581 102.43 238.208C96.7081 224.332 80.8024 217.744 66.9442 223.51C44.6007 232.805 22.1945 210.399 31.4904 188.056C37.256 174.198 30.6677 158.292 16.7915 152.57C-5.58084 143.344 -5.58084 111.656 16.7915 102.43C30.6677 96.7081 37.256 80.8024 31.4904 66.9442C22.1946 44.6007 44.6007 22.1946 66.9442 31.4904C80.8024 37.256 96.7081 30.6677 102.43 16.7915Z"
          fill="white"
          fillOpacity="0.66"
        />
      </svg>
                </div>
                <div className='absolute left-7 bottom-11 font-[500] text-white text-[40px]'>Our Mission & Values</div>
                
            </div>
            <div className='text-lg  max-w-[1000px] mx-auto'>
                <p className='mt-10'>
                At LAWANGELS, we’re more than a platform for Solicitors Qualifying Examination (SQE) preparation, we’re your partner in turning your dream of becoming a solicitor in England and Wales into reality. 
                </p>
            </div>
            <div className="flex max-w-[1200px] mx-auto mt-10 mb-20 items-start gap-8">
  {/* Left column */}
  <div className="w-9/12">
    <p className="text-2xl font-semibold">Our Mission</p>
    {/* ...your long content... */}
    <p className="text-base mt-7">Our mission is to make the SQE journey inclusive, 
      achievable, and empowering for everyone, whether you’re a law graduate, 
      a career changer, or an overseas lawyer. With the SQE’s flexible yet 
      challenging path featuring rigorous exams and Qualifying Work Experience (QWE), 
      we’re here to provide affordable, high-quality resources and a supportive 
      community to ensure your success..</p>
    <p className="text-base mt-7">Designed to remain timeless, 
      our commitment adapts to the evolving SRA framework, 
      helping you qualify no matter when you start. </p>
    <p className='text-base mt-7 pb-7 border-b-2 border-orange-500'>Our mission is rooted in democratizing access to the legal profession.
    We believe anyone with the drive to become a solicitor should have the tools to succeed,
    regardless of background</p>
    <p className='text-base mt-7'>Inclusivity is at the heart of LAWANGELS. We embrace aspiring solicitors from all walks of life, ensuring resources meet your unique needs. Our jurisdiction-specific guides help overseas lawyers  to secure exemptions.</p>
    <p className='text-base mt-7'>LAWANGELS offers tailored resources for diverse learners, law graduates tackling SQE1’s legal knowledge, non-lawyers mastering ethics, or overseas professionals navigating exemptions.
We  aim to inspire confidence, preparing you not just to pass exams but to thrive as an ethical, capable solicitor.</p>
    <p className='text-base mt-7'>
      Excellence drives everything we do. Our resources are crafted to mirror SRA standards, updated annually to stay cutting-edge. We’re committed to delivering tools that maximize your pass chances and prepare you for real-world practice. Subscribe for our textbooks, mock exams and video tutorials, designed to keep you ahead.</p>
    <p className='text-base mt-7'>Innovation sets LAWANGELS apart. Our tools LAW ANGEL AI keep your preparation modern and accessible.  Join LAWANGELS for cutting-edge resources and SRA update alerts, ensuring your prep stays future-proof.
LAWANGELS is your SQE success partner, delivering tailored prep, community support, and timeless resources. Subscribe to LAWANGELS for tools to make you a solicitor.</p>
    {/* many paragraphs */}
    {/* many paragraphs */}
    {/* many paragraphs */}
  </div>

  {/* Sidebar card that matches left column height */}
  
  <aside className="w-3/12 bg-white rounded-2xl border border-orange-500 shadow-lg p-6 flex flex-col">
    {/* Top: image / visual */}
    <div className="w-full mb-5">
      <img
        src="#"
        alt="visual"
        className="w-full h-40 object-cover rounded-lg"
      />
    </div>

    {/* Middle: description — let this grow */}
    <div className="text-sm font-normal text-gray-700 mb-5">
      Lorem ipsum dolor, sit amet consectetur adipisicing elit. Deleniti saepe,
      sapiente maiores numquam consequuntur inventore molestias tempore sunt nesciunt.
    </div>

    {/* Bottom: CTA */}
    <div className="w-full">
      <button className="w-full bg-orange-500 text-white rounded-lg py-2">
        Subscribe
      </button>
    </div>
  </aside>
</div>

            </div>
            </div>

            {/* Mobile / small devices - simplified layout */}
            <div className="md:hidden px-4 mt-20 md:mt-0 mx-2">
              <div className="bg-orange-500 rounded-2xl mt-8 p-5 shadow-md ">
                <div className="text-sm text-white mb-2">
                  About Us {'>'}
                </div>
                <h2 className="text-xl font-semibold text-white">How we support your SQE1 Journey</h2>
              </div>

              <div className="max-w-[720px] mx-auto mt-6 text-sm">
                <p>
                  At LAWANGELS, we’re more than a platform for Solicitors Qualifying Examination (SQE) preparation — we’re your partner in turning your dream of becoming a solicitor in England and Wales.
                </p>
              </div>

              <div className="max-w-[720px] mx-auto mt-6">
                <h3 className="text-lg font-semibold">Our Mission</h3>
                <p className="text-sm mt-3">Our mission is to make the SQE journey inclusive, achievable, and empowering for everyone, whether you’re a law graduate, a career changer, or an overseas lawyer.</p>
                <p className="text-sm mt-3">LAWANGELS offers tailored resources for diverse learners, law graduates tackling SQE1’s legal knowledge, non-lawyers mastering ethics, or overseas professionals navigating exemptions.</p>
              </div>

              <aside className="w-full bg-white rounded-2xl border border-orange-500 shadow-lg p-4 mt-6 mb-6">
                <div className="w-full h-36 bg-gray-100 mb-4" />
                <p className="text-sm text-gray-700">Subscribe to exclusive study planners, mock exams, and a network to guide you every step of the way!</p>
                <button className="w-full bg-orange-500 text-white rounded-lg py-2 mt-4">Subscribe</button>
              </aside>
            </div>
        <Footer />
        </>
    )
}