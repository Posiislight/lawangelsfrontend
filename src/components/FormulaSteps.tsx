import React from 'react';

export default function FormulaSteps() {
  return (
    <section className="bg-white py-16 font-worksans">
      {/* Top Heading */}
      <div className="max-w-3xl mx-auto text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-orange-400 mb-2">Our Formula to Passing in Flying Colors</h2>
        <p className="text-gray-700 text-base md:text-lg mb-12">Our three-step method ensures you not only learn but retain and apply the law, so you’re more than prepared on exam day.</p>
      </div>

      {/* Step 1: Learn */}
      <div className="relative bg-white flex flex-col md:flex-row items-stretch">
        <div className="flex-1 px-8 py-12 md:py-20">
          <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-4">Learn</h3>
          <p className="text-gray-700 max-w-md">Dive into our learning modules crafted by seasoned solicitors. Complex rules are transformed into clear, concise breakdowns with animated explainers and bite-sized video lessons.</p>
        </div>
        <div className="hidden md:block flex-1 relative">
          <div className="absolute right-0 top-0 h-full w-3/4 bg-gray-100 rounded-l-[300px]" style={{borderTopLeftRadius:'300px', borderBottomLeftRadius:'300px'}}></div>
        </div>
      </div>

      {/* Step 2: Reinforce */}
      <div className="relative bg-gray-100 flex flex-col md:flex-row items-stretch">
        <div className="hidden md:block flex-1 relative">
          <div className="absolute left-0 top-0 h-full w-3/4 bg-white rounded-r-[300px]" style={{borderTopRightRadius:'300px', borderBottomRightRadius:'300px'}}></div>
        </div>
        <div className="flex-1 px-8 py-12 md:py-20 md:text-right md:ml-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-4">Reinforce</h3>
          <p className="text-gray-700 max-w-md md:ml-auto">Solidify your understanding with flashcards that target the essentials, and never let them slip away. Break out visually structured mind maps that connect legal principles across topics for full clarity and retention.</p>
        </div>
      </div>

      {/* Step 3: Practice */}
      <div className="relative bg-white flex flex-col md:flex-row items-stretch">
        <div className="flex-1 px-8 py-12 md:py-20">
          <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-4">Practice</h3>
          <p className="text-gray-700 max-w-md">Put your knowledge to the test with thousands of SQE-style MCQs and simulated exam experiences. Track your progress against peers and build the confidence to ace the exam.</p>
          <button className="mt-6 px-5 py-2 bg-sky-400 text-white rounded-full font-semibold text-sm shadow hover:bg-sky-500 transition">Start your Journey</button>
        </div>
        <div className="hidden md:block flex-1 relative">
          <div className="absolute right-0 top-0 h-full w-3/4 bg-gray-100 rounded-l-[300px]" style={{borderTopLeftRadius:'300px', borderBottomLeftRadius:'300px'}}></div>
        </div>
      </div>
    </section>
  );
}
