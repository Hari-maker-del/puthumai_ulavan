import MarketingNav from '@/components/landing/MarketingNav';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Benefits from '@/components/landing/Benefits';
import HowItWorks from '@/components/landing/HowItWorks';
import Pricing from '@/components/landing/Pricing';
import About from '@/components/landing/About';
import Footer from '@/components/landing/Footer';
import FarmWorld3D from '@/components/farm/FarmWorld3D';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';

const questions = [
  { q: 'Is Puthumai Ulavan only for large farms?', a: 'The goal is to help farmers organize their farm information and explore useful tools. Add the land and crop details that apply to your farm.' },
  { q: 'Do I need to know how to use AI?', a: 'No special AI knowledge is needed. Start with the tools and questions that are relevant to your farm, and read each recommendation carefully.' },
  { q: 'Can I rely on every recommendation?', a: 'No tool can guarantee a crop result, yield, profit or diagnosis. Suggestions depend on available data and local conditions. For important decisions, consult a qualified local agricultural expert.' },
  { q: 'How do I start?', a: 'Create an account, complete your farm profile with the details you know, and then explore the tools available in your workspace.' },
];

function FarmerFAQ() {
  return (
    <section id="faq" className="bg-white py-20 lg:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:px-12">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600"><MessageCircleQuestion className="h-4 w-4" /> Good questions</span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-brand-950 sm:text-4xl">Before you get started</h2>
          <p className="mt-4 text-base leading-7 text-brand-800/70">It is your farm and your decision. Here are a few things worth knowing first.</p>
          <a href="/contact" className="mt-5 inline-flex text-sm font-bold text-brand-700 hover:text-brand-900">Need more help? Contact us →</a>
        </div>
        <div className="divide-y divide-brand-100 rounded-2xl border border-brand-100 px-5 sm:px-7">
          {questions.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 font-semibold text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                {q}<ChevronDown className="h-4 w-4 shrink-0 text-brand-600 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-800/70">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <MarketingNav />
      <main>
        <Hero />
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12 lg:py-14" aria-label="Explore the 3D farm experience">
          <FarmWorld3D />
        </section>
        <Features />
        <Benefits />
        <HowItWorks />
        <Pricing />
        <About />
        <FarmerFAQ />
      </main>
      <Footer />
    </div>
  );
}
