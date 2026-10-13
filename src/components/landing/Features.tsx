import { CloudRain, Sprout, ScanLine, Wallet, TrendingUp, MessageCircle, Languages } from 'lucide-react';

const features = [
  { icon: Sprout, title: 'Not sure what to grow?', desc: 'Explore crop suggestions using details such as soil, season, rainfall and the conditions you provide.' , tag: 'Plan your season'},
  { icon: CloudRain, title: 'Planning around the weather?', desc: 'Bring weather information into your planning and check conditions before deciding when to work in the field.', tag: 'Check conditions'},
  { icon: ScanLine, title: 'Worried about crop health?', desc: 'Use the crop-health tools to help examine possible issues. Treat AI results as guidance, not a confirmed diagnosis.', tag: 'Review crop health'},
  { icon: Wallet, title: 'Unsure where money goes?', desc: 'Record seed, fertilizer, labour and other farm expenses so your spending is easier to understand.', tag: 'Track expenses'},
  { icon: TrendingUp, title: 'Thinking about harvest and income?', desc: 'Use available yield and farm records to support planning. Estimates can vary with real field conditions.', tag: 'Plan ahead'},
  { icon: MessageCircle, title: 'Have a farming question?', desc: 'Ask the farming assistant in simple language and use the answer as a starting point for your next decision.', tag: 'Ask for guidance'},
];

export default function Features() {
  return (
    <section id="features" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Made for real farm decisions</span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-brand-950 sm:text-4xl">What is worrying you in the field today?</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-brand-800/70">Start with the problem on your mind. Bring your farm details together and explore practical tools for each stage of the season.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc, tag }) => (
            <article key={title} className="group flex flex-col rounded-2xl border border-brand-100 bg-[#FCFDFB] p-6 transition hover:-translate-y-1 hover:border-brand-300 hover:bg-white hover:shadow-card">
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></span>
                <span className="rounded-full bg-[#F0F5ED] px-3 py-1 text-[11px] font-semibold text-brand-700">{tag}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-brand-950">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-brand-800/70">{desc}</p>
              <a href="/signup" className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">Explore this tool <span aria-hidden="true">→</span></a>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs leading-5 text-brand-800/55">Recommendations and estimates depend on the information available and conditions on your farm. For urgent crop disease or pest issues, consult a qualified local agricultural expert.</p>
      </div>
    </section>
  );
}
