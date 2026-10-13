import { UserRound, Sprout, ListChecks } from 'lucide-react';

const steps = [
  { num: '01', icon: UserRound, title: 'Tell us about your farm', desc: 'Add your location, land size, soil details, water source and the crops you grow. Share only the details you know.' },
  { num: '02', icon: Sprout, title: 'Explore relevant tools', desc: 'Use the available crop, weather, crop-health and expense tools with your farm information.' },
  { num: '03', icon: ListChecks, title: 'Choose your next step', desc: 'Review the information, compare it with what you see in the field, and decide what makes sense for your farm.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Start without the confusion</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-brand-950 sm:text-4xl">Three simple steps, starting with your farm</h2>
          <p className="mt-4 text-base leading-7 text-brand-800/70">You do not need to be a technology expert. Start with the information you have and add more as you go.</p>
        </div>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(({ num, icon: Icon, title, desc }) => (
            <li key={num} className="rounded-2xl border border-brand-100 bg-[#FCFDFB] p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-bold text-brand-200">{num}</span>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></span>
              </div>
              <h3 className="mt-6 text-lg font-bold text-brand-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-brand-800/70">{desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
