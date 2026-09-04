import { motion } from 'framer-motion';
import { Quote, Sprout, Wallet, CloudSun } from 'lucide-react';

const capabilities = [
  { title: 'Farm intelligence', text: 'Keep farms, fields, crops and decisions in one place.', icon: Sprout },
  { title: 'Financial clarity', text: 'Track real expenses and recorded sales to understand farm performance.', icon: Wallet },
  { title: 'Live context', text: 'Bring weather and verified market information into everyday decisions.', icon: CloudSun },
];

export default function Testimonials() {
  return <section id="testimonials" className="relative py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="mx-auto max-w-2xl text-center"><span className="text-sm font-bold uppercase tracking-widest text-brand-600">Built for farmers</span><h2 className="mt-3 font-display text-balance text-3xl font-extrabold text-ink-900 sm:text-4xl">One place for everyday farm decisions</h2><p className="mt-4 text-lg text-ink-800/70">Puthumai Uzhavan connects your farm records with useful live context instead of presenting invented farmer stories or demo results.</p></div><div className="mt-14 grid gap-6 md:grid-cols-3">{capabilities.map((item, i) => { const Icon = item.icon; return <motion.div key={item.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass flex flex-col rounded-3xl p-7 shadow-glass transition-shadow hover:shadow-glass-lg"><Quote className="text-brand-300" size={28} /><div className="mt-5 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon size={22} /></div><h3 className="mt-5 font-display text-xl font-bold text-ink-900">{item.title}</h3><p className="mt-2 leading-relaxed text-ink-800/70">{item.text}</p></motion.div>; })}</div></div></section>;
}
