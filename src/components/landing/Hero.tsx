import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CloudSun,
  Droplets,
  Leaf,
  MapPin,
  Sprout,
  TrendingUp,
  Wheat,
} from 'lucide-react';

const farmSignals = [
  { label: 'Crop planning', value: 'Plan for your season', icon: Sprout },
  { label: 'Farm expenses', value: 'Understand your costs', icon: TrendingUp },
  { label: 'Weather context', value: 'Prepare with care', icon: CloudSun },
];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#F5F7F2]">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] border-l border-[#E3E9DE] bg-[#EEF3E8] lg:block" />
      <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:min-h-[650px] lg:grid-cols-[0.94fr_1.06fr] lg:gap-8 lg:px-14 lg:py-20">
        <div className="relative z-10 max-w-2xl animate-fade-up">
          <div className="inline-flex items-center gap-2 border-b border-[#C8D8C5] pb-2 text-[11px] font-bold uppercase tracking-[0.19em] text-[#28633B]">
            <span className="h-2 w-2 rounded-full bg-[#3C874B]" />
            A farming companion made for your decisions
          </div>

          <p className="mt-5 text-sm font-semibold tracking-wide text-[#806A35] sm:text-base" lang="ta">உழவரின் அறிவுக்கு, தொழில்நுட்பத்தின் துணை.</p>

          <h1 className="mt-4 max-w-[680px] font-display text-[2.75rem] font-semibold leading-[1.04] tracking-[-0.055em] text-[#163B28] sm:text-6xl lg:text-[4.5rem]">
            Your farm.
            <br />
            <span className="text-[#3C874B]">Your knowledge.</span>
            <br />
            Better decisions.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-[#56665A] sm:text-lg sm:leading-8">
            Puthumai Ulavan brings crop planning, farm expenses, weather information and farming guidance into one place—so you can consider your options with your farm's needs in mind.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="/signup" className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#28633B] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(40,99,59,0.14)] transition hover:bg-[#1D4F2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B] focus-visible:ring-offset-2 active:translate-y-px">
              Create your farm profile
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#CBD8C8] bg-white/80 px-5 py-3.5 text-sm font-semibold text-[#28543A] transition hover:border-[#91B39A] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B] focus-visible:ring-offset-2">
              See how it works <ArrowDownRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[#DCE5D8] pt-5 text-xs font-medium text-[#627267]">
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#3C874B]" /> Your farm, your context</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#3C874B]" /> AI guidance, not guarantees</span>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[620px] animate-fade-up [animation-delay:120ms] lg:ml-auto">
          <div className="absolute -right-5 -top-6 h-24 w-24 rounded-full border border-[#B8CDB6] sm:-right-8 sm:-top-8 sm:h-32 sm:w-32" />
          <div className="absolute -bottom-5 -left-4 h-20 w-20 rounded-full border border-[#D7C9A6] sm:-bottom-7 sm:-left-7 sm:h-28 sm:w-28" />

          <div className="relative overflow-hidden rounded-2xl border border-[#DDE5D9] bg-white shadow-[0_22px_60px_rgba(28,57,36,0.12)]">
            <div className="flex items-center justify-between border-b border-[#E8EDE5] px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF3E8] text-[#28633B]"><Wheat className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm font-bold text-[#1E3B2A]">Your farm, in one place</p>
                  <p className="mt-0.5 text-xs text-[#7A887C]">A preview of the farming workspace</p>
                </div>
              </div>
              <span className="rounded-full border border-[#DDE8D8] bg-[#F4F8F1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#3A7147]">Preview</span>
            </div>

            <div className="p-4 sm:p-6">
              <div className="relative overflow-hidden rounded-xl bg-[#173F2B] p-5 text-white sm:p-6">
                <div className="absolute -right-7 -top-12 h-44 w-44 rounded-full border border-white/10" />
                <div className="absolute -right-1 -top-6 h-32 w-32 rounded-full border border-white/10" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-white/65">YOUR FARM, YOUR PLAN</p>
                    <h2 className="mt-2 max-w-xs font-display text-2xl font-semibold leading-tight sm:text-3xl">Make the next decision with more clarity.</h2>
                    <p className="mt-2 max-w-sm text-xs leading-5 text-white/70 sm:text-sm">Bring your crops, activities and farm records together.</p>
                  </div>
                  <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 sm:grid"><Leaf className="h-5 w-5 text-[#C7E3A9]" /></span>
                </div>
                <div className="relative mt-6 flex items-center gap-2 border-t border-white/15 pt-4 text-xs text-white/75"><MapPin className="h-3.5 w-3.5 text-[#C7E3A9]" />Personalize with your farm location and details</div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {farmSignals.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-[#E5EBE1] bg-white p-3.5 sm:p-4">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#F0F5ED] text-[#367347]"><Icon className="h-4 w-4" /></span>
                    <p className="mt-3 text-xs font-semibold text-[#294735]">{label}</p>
                    <p className="mt-1 text-[11px] leading-4 text-[#7B887D]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#E8E4D6] bg-[#FAF8F1] p-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F0E9D5] text-[#806A35]"><Droplets className="h-4 w-4" /></span>
                <div>
                  <p className="text-xs font-bold text-[#574D32]">Guidance shaped by your farm details</p>
                  <p className="mt-1 text-xs leading-5 text-[#81775E]">Use available crop, soil, season and farm records to add context to your decisions.</p>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-[#788579]">Illustrative product preview · Actual insights depend on available data and farm conditions</p>
        </div>
      </div>
    </section>
  );
}
