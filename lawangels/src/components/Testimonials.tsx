const testimonials = [
  {
    quote: 'An outstanding online learning platform with exceptional courses to prepare you for the SQE exam. The structured approach and comprehensive materials made all the difference in my success.',
    name: 'Brian Russell',
    role: 'Simon Burn Solicitors',
  },
  {
    quote: 'Law Angels transformed my exam preparation. The interactive lessons and practice questions are incredibly helpful, and the support team is always available when you need guidance.',
    name: 'Sarah Mitchell',
    role: 'Taylor & Associates Legal',
  },
  {
    quote: 'I was overwhelmed preparing for the SQE, but this platform broke everything down into manageable modules. The quality of content and expert instructors gave me the confidence to excel.',
    name: 'James Thompson',
    role: 'Corporate Law Partners',
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
