import learnimage from '../assets/learnimg.webp';
import reinforceimage from '../assets/reinforceimg.webp';
import practiceimage from '../assets/practiceimg.webp';

export default function FormulaSteps() {
  return (
    <section className="bg-[#FFF7F0] py-14 md:py-20 font-worksans md:mx-2 px-6 ">
      {/* Heading */}
      <div className="max-w-5xl mx-auto px-0 text-left lg:ml-52">
        <h2 className="text-3xl md:text-5xl font-semibold text-slate-800 leading-tight">
          Our Formula to Passing in
        </h2>
        <p className="text-3xl md:text-5xl font-semibold text-orange-500 mt-1">Flying Colors</p>
        <p className="mt-6 max-w-3xl text-slate-700 text-base md:text-lg ">
          Dive into our learning modules crafted by seasoned solicitors. Complex rules are transformed into
          clear, concise breakdowns with animated explainers and bite-sized video lessons.
        </p>
      </div>

      <div className="max-w-6xl mx-auto mt-12 px-4">
        {/* =========================
            DESKTOP / TABLET (md and up)
            KEEP ORIGINAL LAYOUT (unchanged)
            ========================= */}
        <div className="hidden md:block">
          {/* Image row (unchanged) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <img src={learnimage} alt="Learn" className="w-full h-56 md:h-64 object-cover rounded-2xl shadow" />
            <img src={reinforceimage} alt="Reinforce" className="w-full h-56 md:h-64 object-cover rounded-2xl shadow" />
            <img src={practiceimage} alt="Practice" className="w-full h-56 md:h-64 object-cover rounded-2xl shadow" />
          </div>

          {/* Horizontal connector + markers */}
          <div className="relative mt-10 px-8">
            <div className="border-t-4 border-orange-400"></div>
            
            {/* Star positioned on the left */}
            <div className="absolute -top-5 left-0 z-10">
              <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.527 2.54385C16.9257 -0.847885 21.7296 -0.847885 23.1283 2.54385C23.9958 4.64752 26.4072 5.64633 28.5081 4.77225C31.8955 3.36296 35.2923 6.75981 33.883 10.1472C33.0089 12.2481 34.0078 14.6595 36.1114 15.527C39.5032 16.9257 39.5032 21.7296 36.1114 23.1283C34.0078 23.9958 33.0089 26.4072 33.883 28.5081C35.2923 31.8955 31.8955 35.2923 28.5081 33.883C26.4072 33.0089 23.9958 34.0078 23.1283 36.1114C21.7296 39.5032 16.9257 39.5032 15.527 36.1114C14.6595 34.0078 12.2481 33.0089 10.1472 33.883C6.75981 35.2923 3.36296 31.8955 4.77225 28.5081C5.64633 26.4072 4.64752 23.9958 2.54385 23.1283C-0.847885 21.7296 -0.847885 16.9257 2.54385 15.527C4.64752 14.6595 5.64633 12.2481 4.77225 10.1472C3.36296 6.75981 6.75981 3.36296 10.1472 4.77225C12.2481 5.64633 14.6595 4.64752 15.527 2.54385Z" fill="#E35C02"/>
              </svg>
            </div>
            
            {/* Star positioned in the center */}
            <div className="absolute -top-5 left-[400px] transform -translate-x-1/2 z-10">
              <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.527 2.54385C16.9257 -0.847885 21.7296 -0.847885 23.1283 2.54385C23.9958 4.64752 26.4072 5.64633 28.5081 4.77225C31.8955 3.36296 35.2923 6.75981 33.883 10.1472C33.0089 12.2481 34.0078 14.6595 36.1114 15.527C39.5032 16.9257 39.5032 21.7296 36.1114 23.1283C34.0078 23.9958 33.0089 26.4072 33.883 28.5081C35.2923 31.8955 31.8955 35.2923 28.5081 33.883C26.4072 33.0089 23.9958 34.0078 23.1283 36.1114C21.7296 39.5032 16.9257 39.5032 15.527 36.1114C14.6595 34.0078 12.2481 33.0089 10.1472 33.883C6.75981 35.2923 3.36296 31.8955 4.77225 28.5081C5.64633 26.4072 4.64752 23.9958 2.54385 23.1283C-0.847885 21.7296 -0.847885 16.9257 2.54385 15.527C4.64752 14.6595 5.64633 12.2481 4.77225 10.1472C3.36296 6.75981 6.75981 3.36296 10.1472 4.77225C12.2481 5.64633 14.6595 4.64752 15.527 2.54385Z" fill="#E35C02"/>
              </svg>
            </div>
            
            {/* Star positioned on the right */}
            <div className="absolute -top-5 right-[300px] z-10">
              <svg width="39" height="39" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.527 2.54385C16.9257 -0.847885 21.7296 -0.847885 23.1283 2.54385C23.9958 4.64752 26.4072 5.64633 28.5081 4.77225C31.8955 3.36296 35.2923 6.75981 33.883 10.1472C33.0089 12.2481 34.0078 14.6595 36.1114 15.527C39.5032 16.9257 39.5032 21.7296 36.1114 23.1283C34.0078 23.9958 33.0089 26.4072 33.883 28.5081C35.2923 31.8955 31.8955 35.2923 28.5081 33.883C26.4072 33.0089 23.9958 34.0078 23.1283 36.1114C21.7296 39.5032 16.9257 39.5032 15.527 36.1114C14.6595 34.0078 12.2481 33.0089 10.1472 33.883C6.75981 35.2923 3.36296 31.8955 4.77225 28.5081C5.64633 26.4072 4.64752 23.9958 2.54385 23.1283C-0.847885 21.7296 -0.847885 16.9257 2.54385 15.527C4.64752 14.6595 5.64633 12.2481 4.77225 10.1472C3.36296 6.75981 6.75981 3.36296 10.1472 4.77225C12.2481 5.64633 14.6595 4.64752 15.527 2.54385Z" fill="#E35C02"/>
              </svg>
            </div>
          </div>

          {/* Steps copy (unchanged) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-slate-800">Master</h3>
              <p className="mt-4 text-slate-700">
                Dive into our learning modules crafted by seasoned solicitors. Complex rules are transformed into clear,
                concise breakdowns with animated explainers and bite-sized video lessons.
              </p>
            </div>

            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-slate-800">Memorize</h3>
              <p className="mt-4 text-slate-700">
                Solidify your understanding with flashcards that target the essentials, and never let them slip away.
                Break out visually structured mind maps that connect legal principles across topics for full clarity and
                retention.
              </p>
            </div>

            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-slate-800">Maximize</h3>
              <p className="mt-4 text-slate-700">
                Put your knowledge to the test with thousands of SQE-style MCQs and simulated exam experiences. Track your
                progress against peers and build the confidence to ace the exam.
              </p>
            </div>
          </div>
        </div>

        {/* =========================
            MOBILE (below md)
            Each step: Title -> Text -> Image (image AFTER step)
            Vertical connector + markers
            ========================= */}
        <div className="md:hidden relative mt-4">
          {/* Vertical connector line running down the left of the steps */}
          <div className="absolute top-6 bottom-6 " aria-hidden="true" />

          {/* Step 1 */}
          <div className="relative  pb-12 border-b-4 border-orange-400 ">
            

            <h3 className="text-2xl font-semibold text-slate-800">Master</h3>
            <p className="mt-2 text-slate-700">
              Dive into our learning modules crafted by seasoned solicitors. Complex rules are transformed into clear,
              concise breakdowns with animated explainers and bite-sized video lessons.
            </p>

            {/* image AFTER the step copy */}
            <img src={learnimage} alt="Learn" className="w-full h-56 object-cover rounded-2xl shadow mt-4" />
          </div>

          {/* Step 2 */}
          <div className="relative pb-12 pt-12 border-b-4 border-orange-400">
            

            <h3 className="text-2xl font-semibold text-slate-800 ">Memorize</h3>
            <p className="mt-2 text-slate-700">
              Solidify your understanding with flashcards that target the essentials, and never let them slip away.
              Break out visually structured mind maps that connect legal principles across topics for full clarity and
              retention.
            </p>

            {/* image AFTER the step copy */}
            <img src={reinforceimage} alt="Reinforce" className="w-full h-56 object-cover rounded-2xl shadow mt-4" />
          </div>

          {/* Step 3 */}
          <div className="relative pb-6 pt-6 ">
            

            <h3 className="text-2xl font-semibold text-slate-800">Maximize</h3>
            <p className="mt-2 text-slate-700">
              Put your knowledge to the test with thousands of SQE-style MCQs and simulated exam experiences. Track your
              progress against peers and build the confidence to ace the exam.
            </p>

            {/* image AFTER the step copy */}
            <img src={practiceimage} alt="Practice" className="w-full h-56 object-cover rounded-2xl shadow mt-4" />
          </div>
        </div>
      </div>
    </section>
  );
}
