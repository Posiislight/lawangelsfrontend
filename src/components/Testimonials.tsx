import { useState } from 'react';

const testimonials = [
  {
    quote: 'An outstanding online learning platform with exceptional courses to prepare you for the SQE exam.',
    name: 'Brian Russell',
    role: 'Simon Burn Solicitors',
  },
  {
    quote: 'An outstanding online learning platform with exceptional courses to prepare you for the SQE exam.',
    name: 'Brian Russell',
    role: 'Simon Burn Solicitors',
  },
  {
    quote: 'An outstanding online learning platform with exceptional courses to prepare you for the SQE exam.',
    name: 'Brian Russell',
    role: 'Simon Burn Solicitors',
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  function prev() {
    setIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
  }
  function next() {
    setIndex((i) => (i + 1) % testimonials.length);
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold">Our Users Testimonials</h2>
        <p className="mt-2 text-gray-600 mb-8">Our users love the results they get.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`p-8 bg-gray-100 rounded-md shadow ${i === index ? 'opacity-100' : 'opacity-40'} transition-opacity duration-300`}
            >
              <p className="text-xl text-slate-600 mb-6 leading-8">{t.quote}</p>
              <div className="font-semibold">{t.name}</div>
              <div className="text-orange-500">{t.role}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
          <button onClick={prev} className="w-12 h-12 rounded-full border shadow-sm hover:shadow-lg transition flex items-center justify-center">‹</button>
          <button onClick={next} className="w-12 h-12 rounded-full border shadow-sm hover:shadow-lg transition flex items-center justify-center">›</button>
        </div>
      </div>
    </section>
  );
}
