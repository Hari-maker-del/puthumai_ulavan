import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  CloudSun,
  Leaf,
  MapPin,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Wheat,
} from 'lucide-react';

const farmSignals = [
  { label: 'Crop planning', value: 'Plan your season', icon: Sprout },
  { label: 'Farm finances', value: 'Know your numbers', icon: TrendingUp },
  { label: 'Weather context', value: 'Prepare ahead', icon: CloudSun },
];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#F4F6EE]">
      <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#DDEACF]/70 blur-3xl" />
      <div className="pointer-events-none absolute right-[38%] top-0 h-72 w-72 rounded-full bg-[#F1E7C8]/55 blur-3xl" />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:min-h-[700px] lg:grid-cols-[0.88fr_1.12fr] lg:gap-8 lg:px-14 lg:py-16">
        <div className="relative z-10 max-w-2xl animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D5E2CC] bg-white/75 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#28633B] shadow-sm backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#75A85C] opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3C874B]" />
            </span>
            A smarter way to care for your farm
          </div>

          <p className="mt-6 text-sm font-semibold tracking-wide text-[#8A6B2C] sm:text-base" lang="ta">
            உழவரின் அறிவுக்கு, தொழில்நுட்பத்தின் துணை.
          </p>

          <h1 className="mt-4 max-w-[680px] font-display text-[2.8rem] font-semibold leading-[1.02] tracking-[-0.06em] text-[#163B28] sm:text-6xl lg:text-[4.65rem]">
            Every season
            <br />
            <span className="relative inline-block text-[#43824B]">
              starts with
              <svg aria-hidden="true" viewBox="0 0 270 13" className="absolute -bottom-1 left-0 h-3 w-full text-[#D7A94B]" fill="none">
                <path d="M3 8C69 1 186 1 267 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>
            <br />
            a better plan.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-[#56665A] sm:text-lg sm:leading-8">
            One calm, clear workspace for crop decisions, field activities, farm expenses and local conditions—built to support the people who know their land best.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
            <a href="/signup" className="group inline-flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-[#28633B] px-6 py-4 text-sm font-bold text-white sm:w-fit shadow-[0_12px_28px_rgba(40,99,59,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1D4F2E] hover:shadow-[0_16px_32px_rgba(40,99,59,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B] focus-visible:ring-offset-2">
              Start your farm workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#how-it-works" className="hidden min-h-13 items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold text-[#28543A] sm:inline-flex transition hover:bg-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B]">
              See how it works <ArrowDownRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-7 hidden flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-[#627267] sm:mt-8 sm:flex">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#43824B]" /> Your farm data stays yours</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#43824B]" /> Guidance, not guesswork</span>
          </div>

          <div className="mt-9 hidden max-w-xl grid-cols-3 gap-3 border-t border-[#DCE5D8] pt-5 sm:grid">
            <div><p className="font-display text-xl font-bold tracking-tight text-[#1D4D31] sm:text-2xl">Plan</p><p className="mt-1 text-[11px] leading-4 text-[#718073] sm:text-xs">Crop & season</p></div>
            <div className="border-l border-[#DCE5D8] pl-3 sm:pl-5"><p className="font-display text-xl font-bold tracking-tight text-[#1D4D31] sm:text-2xl">Track</p><p className="mt-1 text-[11px] leading-4 text-[#718073] sm:text-xs">Costs & activities</p></div>
            <div className="border-l border-[#DCE5D8] pl-3 sm:pl-5"><p className="font-display text-xl font-bold tracking-tight text-[#1D4D31] sm:text-2xl">Learn</p><p className="mt-1 text-[11px] leading-4 text-[#718073] sm:text-xs">Farm-specific context</p></div>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[690px] animate-fade-up [animation-delay:120ms] lg:ml-auto">
          <div className="absolute -right-4 -top-5 z-20 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-[0_14px_36px_rgba(25,55,34,0.16)] backdrop-blur sm:block lg:-right-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E8F2E1] text-[#28633B]"><Wheat className="h-4 w-4" /></span>
              <div><p className="text-xs font-bold text-[#1E3B2A]">Your farm, your way</p><p className="mt-0.5 text-[10px] text-[#7A887C]">One connected workspace</p></div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border-[5px] border-white bg-[#173F2B] shadow-[0_28px_80px_rgba(28,57,36,0.22)] sm:border-[7px]">
            <div className="relative min-h-[390px] sm:min-h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=85"
                alt="Green agricultural fields stretching across a sunlit rural landscape"
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#102D1E]/95 via-[#183C27]/30 to-[#193B27]/5" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#173F2B]/35 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D6EAAE]" /> Farm intelligence
                </span>
                <span className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md"><ArrowUpRight className="h-5 w-5" /></span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D6EAAE]">Built around your land</p>
                <h2 className="mt-2 max-w-md font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-4xl">
                  From the first seed to the final harvest.
                </h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                  Bring your crop plans, field work and farm records into a view that helps you see what needs attention next.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                  {farmSignals.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-xl border border-white/20 bg-[#F7FAF2]/95 p-3 shadow-lg backdrop-blur-md sm:p-3.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#E6F0DF] text-[#367347]"><Icon className="h-4 w-4" /></span>
                      <p className="mt-2 text-[11px] font-bold leading-4 text-[#294735] sm:text-xs">{label}</p>
                      <p className="mt-1 hidden text-[10px] leading-4 text-[#7B887D] sm:block">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 -left-3 z-20 hidden items-center gap-3 rounded-2xl border border-[#DDE8D8] bg-white px-4 py-3 shadow-[0_14px_36px_rgba(25,55,34,0.15)] sm:flex lg:-left-7">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#F4EBD2] text-[#8A6B2C]"><MapPin className="h-4 w-4" /></span>
            <div><p className="text-xs font-bold text-[#294735]">Local context matters</p><p className="mt-0.5 text-[10px] text-[#7B887D]">Your land. Your conditions.</p></div>
          </div>
          <p className="mt-5 text-center text-[10px] text-[#788579]">Tools support your judgement; actual outcomes depend on field conditions.</p>
        </div>
      </div>
    </section>
  );
}
