const testimonials = [
  {
    quote: 'Law Angels offered excellent value for my money. The amount of content and support included made it far more affordable than I expected.',
    name: 'Emily Carter',
    role: 'SQE Candidate, UK',
  },
  {
    quote: 'The strength of Law Angels lies in its attention to detail. The summaries, flashcards, and AI tutor helped reinforce learning without unnecessary complexity',
    name: 'Mei Lin Tan',
    role: 'Trainee Solicitor',
  },
  {
    quote: 'After failing my first attempt, my confidence was quite low. Law Angels helped me slow down and rebuild properly. The explanations, study plan, and consistent practice tools helped me understand why I was getting things wrong. It helped me believe I could pass again',
    name: 'Daniel Brooks',
    role: 'SQE Resit Candidate',
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 bg-gray-100 font-worksans">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <div className="text-sm text-gray-500">Our Testimonials</div>
          <h2 className="mt-2 text-3xl md:text-5xl font-normal text-slate-800 leading-tight font-crimson">
            Our users love the
            <br />
            results they get.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md px-8 py-10 text-center transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-orange-50 cursor-pointer">
              <p className="text-slate-600 leading-7">{t.quote}</p>
              <div className="mt-6 font-semibold text-slate-800">{t.name}</div>
              <div className="text-orange-500 text-sm">{t.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
