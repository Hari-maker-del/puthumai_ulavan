import { HandHeart, Leaf, ShieldCheck, Sprout } from 'lucide-react';

const principles = [
  { icon: Sprout, title: 'Your farm comes first', desc: 'Tools should start from your land, season and farming goals—not one-size-fits-all advice.' },
  { icon: HandHeart, title: 'Built around Indian farming', desc: 'The experience is shaped for the realities of Indian agriculture and the decisions farmers make every season.' },
  { icon: ShieldCheck, title: 'Clear about AI guidance', desc: 'AI suggestions are aids to decision-making, not guarantees of yield, profit, weather or disease diagnosis.' },
  { icon: Leaf, title: 'Farmer knowledge stays important', desc: 'Your experience and local conditions matter. Use the platform alongside trusted agricultural experts when needed.' },
];

export default function About() {
  return (
    <section id="about" className="bg-[#F5F7F2] py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Our promise</span>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-brand-950 sm:text-4xl">Technology for farmers. Not more work for farmers.</h2>
            <p className="mt-5 text-base leading-7 text-brand-800/75">Puthumai Ulavan brings useful farm tools into one place so you can spend less time searching for records and more time making considered decisions. We aim to make the experience understandable, practical and respectful of every farmer's experience.</p>
            <p className="mt-4 text-sm leading-6 text-brand-800/65">We will be clear when a feature uses estimates or AI-generated guidance. Always consider local conditions and qualified agricultural advice before making high-impact decisions.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="rounded-2xl border border-brand-100 bg-white p-6">
                <Icon className="h-6 w-6 text-brand-600" />
                <h3 className="mt-4 font-bold text-brand-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-800/70">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
