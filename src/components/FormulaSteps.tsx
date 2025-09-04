

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function FormulaSteps() {
  const curvedVariantsRight: any = {
    initial: { scaleX: 0.75, borderTopRightRadius: 300, borderBottomRightRadius: 300, backgroundColor: '#ffffff' },
    hover: { scaleX: 1, borderTopRightRadius: 48, width:"250%",zIndex: 0, borderBottomRightRadius: 48, backgroundColor: '#BFDBFE', transition: { duration: 1.25, ease: [0.22, 1, 0.36, 1] } },
  };

  const curvedVariantsLeft: any = {
    initial: { scaleX: 0.75, borderTopLeftRadius: 300, borderBottomLeftRadius: 300, backgroundColor: '#f3f4f6' },
    hover: { scaleX: 1, borderTopLeftRadius: 48, zIndex: 0, width:"250%",borderBottomLeftRadius: 48, backgroundColor: '#BFDBFE', transition: { duration: 1.25, ease: [0.22, 1, 0.36, 1] } },
  };
  useEffect(() => {
    const steps = document.querySelectorAll<HTMLElement>('.step');
    if (!steps.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15 }
    );
    steps.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
  <section className="bg-white py-12 md:py-16 font-worksans">
      {/* Top Heading */}
      <div className="max-w-3xl mx-auto text-center px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-orange-400 mb-2">Our Formula to Passing in Flying Colors</h2>
        <p className="text-gray-700 text-base md:text-lg mb-12">Our three-step method ensures you not only learn but retain and apply the law, so you’re more than prepared on exam day.</p>
      </div>

      {/* Step 1: Learn */}
      <motion.div className="relative bg-white flex flex-col md:flex-row items-stretch step overflow-hidden" whileHover="hover" initial="initial">
        <div className="flex-1 px-4 py-10 md:px-6 md:py-16 min-h-[260px] md:min-h-[380px] lg:min-h-[520px] flex flex-col justify-center z-10">
          <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-4 text-center md:text-left">Learn</h3>
          <p className="text-gray-700 max-w-full md:max-w-md">Dive into our learning modules crafted by seasoned solicitors. Complex rules are transformed into clear, concise breakdowns with animated explainers and bite-sized video lessons.</p>
        </div>
        <div className="hidden md:block flex-1 relative">
          <motion.div
            className="absolute right-0 top-0 h-full w-3/4"
            style={{ transformOrigin: 'left center' }}
            variants={curvedVariantsLeft}
          />
        </div>
      </motion.div>

      {/* Step 2: Reinforce */}
      <motion.div className="relative bg-gray-100 flex flex-col md:flex-row items-stretch step overflow-hidden" whileHover="hover" initial="initial">
        <div className="hidden md:block flex-1 relative">
          <motion.div
            className="absolute left-0 top-0 h-full w-3/4"
            style={{ transformOrigin: 'right center' }}
            variants={curvedVariantsRight}
          />
        </div>
        <div className="flex-1 px-4 py-10 md:px-6 md:py-16 md:text-right md:ml-auto min-h-[260px] md:min-h-[380px] lg:min-h-[520px] flex flex-col justify-center z-10">
          <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-4 text-center md:text-right">Reinforce</h3>
          <p className="text-gray-700 max-w-full md:max-w-md md:ml-auto">Solidify your understanding with flashcards that target the essentials, and never let them slip away. Break out visually structured mind maps that connect legal principles across topics for full clarity and retention.</p>
        </div>
      </motion.div>

      {/* Step 3: Practice */}
      <motion.div className="relative bg-white flex flex-col md:flex-row items-stretch step overflow-hidden" whileHover="hover" initial="initial">
        <div className="flex-1 px-4 py-10 md:px-6 md:py-16 min-h-[260px] md:min-h-[380px] lg:min-h-[520px] flex flex-col justify-center z-10">
          <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-4 text-center md:text-left">Practice</h3>
          <p className="text-gray-700 max-w-full md:max-w-md">Put your knowledge to the test with thousands of SQE-style MCQs and simulated exam experiences. Track your progress against peers and build the confidence to ace the exam.</p>
          <button className="mt-6 px-5 py-3 bg-sky-400 text-white rounded-full font-semibold text-sm shadow hover:bg-sky-500 transition w-full md:w-auto lg:ml-24">Start your Journey</button>
        </div>
        <div className="hidden md:block flex-1 relative">
          <motion.div
            className="absolute right-0 top-0 h-full w-3/4"
            style={{ transformOrigin: 'left center' }}
            variants={curvedVariantsLeft}
          />
        </div>
      </motion.div>
      
      <style>{`
        .step{ opacity: 0; transform: translateY(24px); transition: opacity 700ms ease, transform 700ms ease; }
        .step.is-visible{ opacity: 1; transform: translateY(0); }
      `}</style>
    </section>
  );
}
