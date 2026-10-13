import { BookOpen, Clock3, Languages, ClipboardList } from 'lucide-react';

const benefits = [
  { icon: ClipboardList, title: 'Keep farm details in one place', desc: 'Bring your farm profile, crop plans and expense records together instead of relying on scattered notes.' },
  { icon: Clock3, title: 'Make time for the field', desc: 'Find key tools from one workspace and review the information you need before planning your next task.' },
  { icon: Languages, title: 'Make technology feel approachable', desc: 'Use a clear, simple interface and choose the language options available in the product.' },
  { icon: BookOpen, title: 'Understand before you act', desc: 'See guidance as decision support. Compare it with your field experience and local expert advice.' },
];

export default function Benefits() {
  return (
    <section id="benefits" className="bg-[#F5F7F2] py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16 lg:px-12">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Less confusion, clearer records</span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-brand-950 sm:text-4xl">Your experience matters. The tools should support it.</h2>
          <p className="mt-5 text-base leading-7 text-brand-800/75">Every farm is different. Puthumai Ulavan is designed to help you organize information and consider your options—not to replace the knowledge you have built from years in the field.</p>
          <a href="/signup" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2">Create your farm profile <span className="ml-2" aria-hidden="true">→</span></a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="rounded-2xl border border-brand-100 bg-white p-5 sm:p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-bold text-brand-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-brand-800/70">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
