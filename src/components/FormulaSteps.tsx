import learnimage from '../assets/learnimg.jpg';
import reinforceimage from '../assets/reinforceimg.jpg';
import practiceimage from '../assets/practiceimg.jpg';

export default function FormulaSteps() {
  return (
    <section className="bg-[#FFF7F0] py-14 md:py-20 font-worksans">
      {/* Heading */}
      <div className="max-w-5xl mx-auto px-0 text-left mx-52">
        <h2 className="text-3xl md:text-5xl font-semibold text-slate-800 leading-tight">
          Our Formula to Passing in
        </h2>
        <p className="text-3xl md:text-5xl font-semibold text-orange-500 mt-1">Flying Colors</p>
        <p className="mt-6 max-w-3xl text-slate-700 text-base md:text-lg">
          Dive into our learning modules crafted by seasoned solicitors. Complex rules are transformed into
          clear, concise breakdowns with animated explainers and bite-sized video lessons.
        </p>
      </div>

      {/* Image row */}
      <div className="max-w-6xl mx-auto mt-12 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <img src={learnimage} alt="Learn" className="w-full h-56 md:h-64 object-cover rounded-2xl shadow" />
        <img src={reinforceimage} alt="Reinforce" className="w-full h-56 md:h-64 object-cover rounded-2xl shadow" />
        <img src={practiceimage} alt="Practice" className="w-full h-56 md:h-64 object-cover rounded-2xl shadow" />
      </div>

      {/* Connector line with markers */}
      <div className="relative max-w-6xl mx-auto mt-10 px-8">
        <div className="border-t-4 border-orange-400"></div>
        <div className="absolute -top-3 left-[16.666%] w-6 h-6 bg-orange-500 rounded-full"></div>
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-orange-500 rounded-full"></div>
        <div className="absolute -top-3 right-[16.666%] w-6 h-6 bg-orange-500 rounded-full"></div>
      </div>

      {/* Steps copy */}
      <div className="max-w-6xl mx-auto mt-10 px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold text-slate-800">Learn</h3>
          <p className="mt-4 text-slate-700">
            Dive into our learning modules crafted by seasoned solicitors. Complex rules are transformed into clear,
            concise breakdowns with animated explainers and bite-sized video lessons.
          </p>
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold text-slate-800">Reinforce</h3>
          <p className="mt-4 text-slate-700">
            Solidify your understanding with flashcards that target the essentials, and never let them slip away. Break
            out visually structured mind maps that connect legal principles across topics for full clarity and
            retention.
          </p>
        </div>
        <div>
          <h3 className="text-2xl md:text-3xl font-semibold text-slate-800">Practice</h3>
          <p className="mt-4 text-slate-700">
            Put your knowledge to the test with thousands of SQE-style MCQs and simulated exam experiences. Track your
            progress against peers and build the confidence to ace the exam.
          </p>
        </div>
      </div>
    </section>
  );
}
