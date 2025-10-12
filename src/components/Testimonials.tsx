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
  return (
    <section className="py-20 bg-gray-100 font-worksans">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <div className="text-sm text-gray-500">Our Testimonials</div>
          <h2 className="mt-2 text-3xl md:text-5xl font-normal text-slate-800 leading-tight">
            Our users love the
            <br />
            results they get.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md px-8 py-10 text-center">
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
