import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  CloudSun,
  Leaf,
  MapPin,
  Sprout,
  TrendingUp,
  Wheat,
  CalendarDays,
  IndianRupee,
  MessageCircle,
} from 'lucide-react';

const previewTabs = [
  { id: 'crops', label: 'Crop planning', icon: Sprout },
  { id: 'expenses', label: 'Farm expenses', icon: TrendingUp },
  { id: 'weather', label: 'Weather context', icon: CloudSun },
  { id: 'guidance', label: 'Farming guidance', icon: MessageCircle },
] as const;

type PreviewTab = (typeof previewTabs)[number]['id'];

function PreviewContent({ activeTab }: { activeTab: PreviewTab }) {
  if (activeTab === 'crops') {
    return (
      <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.07] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Sprout className="h-4 w-4 text-[#C7E3A9]" /> Example crop plan</div>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-[#D8E9D0]">DEMO DATA</span>
        </div>
        <p className="mt-3 text-lg font-semibold">Paddy · Sample season</p>
        <p className="mt-1 text-xs leading-5 text-white/70">A sample plan can organize planting activities, crop stage notes and reminders in one place.</p>
        <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-3 text-xs text-white/75"><CalendarDays className="h-4 w-4 text-[#C7E3A9]" /> Example activity: review planting schedule</div>
      </div>
    );
  }

  if (activeTab === 'expenses') {
    return (
      <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.07] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><IndianRupee className="h-4 w-4 text-[#C7E3A9]" /> Example expense record</div>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-[#D8E9D0]">DEMO DATA</span>
        </div>
        <p className="mt-3 text-2xl font-semibold">₹2,450 <span className="text-xs font-normal text-white/60">sample total</span></p>
        <div className="mt-3 space-y-3">
          {[['Seeds', '₹900', 'w-[38%]'], ['Labour', '₹1,000', 'w-[43%]'], ['Other', '₹550', 'w-[24%]']].map(([label, amount, width]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs text-white/75"><span>{label}</span><span>{amount}</span></div>
              <div className="h-1.5 rounded-full bg-white/10"><div className={`h-full rounded-full bg-[#C7E3A9] ${width}`} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'weather') {
    return (
      <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.07] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><CloudSun className="h-4 w-4 text-[#C7E3A9]" /> Weather context</div>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-[#D8E9D0]">PREVIEW</span>
        </div>
        <p className="mt-3 text-lg font-semibold">Check local conditions</p>
        <p className="mt-1 text-xs leading-5 text-white/70">Live weather is not shown in this sample panel. When a verified weather source and farm location are available, use them to review current conditions.</p>
        <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-3 text-xs text-white/75"><MapPin className="h-4 w-4 text-[#C7E3A9]" /> Add your farm location for relevant context</div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-white/15 bg-white/[0.07] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><MessageCircle className="h-4 w-4 text-[#C7E3A9]" /> Farming guidance</div>
        <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-[#D8E9D0]">EXAMPLE</span>
      </div>
      <p className="mt-3 text-lg font-semibold">Advice should fit your farm</p>
      <p className="mt-1 text-xs leading-5 text-white/70">Useful guidance depends on details such as crop, soil, season and recent farm records. Verify important decisions with a qualified local agriculture expert.</p>
      <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-3 text-xs text-white/75"><Leaf className="h-4 w-4 text-[#C7E3A9]" /> AI guidance supports decisions; it does not guarantee results</div>
    </div>
  );
}

export default function Hero() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('crops');

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
                  <p className="mt-0.5 text-xs text-[#7A887C]">Explore a sample farming workspace</p>
                </div>
              </div>
              <span className="rounded-full border border-[#DDE8D8] bg-[#F4F8F1] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#3A7147]">Interactive demo</span>
            </div>

            <div className="p-4 sm:p-6">
              <div className="relative overflow-hidden rounded-xl bg-[#173F2B] p-5 text-white sm:p-6">
                <div className="absolute -right-7 -top-12 h-44 w-44 rounded-full border border-white/10" />
                <div className="absolute -right-1 -top-6 h-32 w-32 rounded-full border border-white/10" />
                <div className="relative">
                  <p className="text-xs font-medium text-white/65">A SAMPLE FARM WORKSPACE</p>
                  <h2 className="mt-2 max-w-md font-display text-2xl font-semibold leading-tight sm:text-3xl">See what you can organize in one place.</h2>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-white/70 sm:text-sm">Choose a section below to explore illustrative examples.</p>
                  <PreviewContent activeTab={activeTab} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {previewTabs.map(({ id, label, icon: Icon }) => {
                  const selected = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      aria-pressed={selected}
                      className={`flex min-h-[92px] flex-col items-start rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B] focus-visible:ring-offset-2 ${selected ? 'border-[#8EB69A] bg-[#EFF6EC] text-[#214D30]' : 'border-[#E5EBE1] bg-white text-[#294735] hover:border-[#B9CEB7] hover:bg-[#FAFCF8]'}`}
                    >
                      <span className={`grid h-8 w-8 place-items-center rounded-lg ${selected ? 'bg-[#DDEED8] text-[#28633B]' : 'bg-[#F0F5ED] text-[#367347]'}`}><Icon className="h-4 w-4" /></span>
                      <span className="mt-2 text-xs font-semibold leading-4">{label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#E5EBE1] bg-[#F8FAF6] p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-[#647263]">Sample content for illustration only—not live or personalized farm data.</p>
                <a href="/signup" className="inline-flex shrink-0 items-center justify-center gap-2 text-sm font-semibold text-[#28633B] hover:text-[#163B28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B]">
                  Create your farm profile <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-[#788579]">Illustrative preview · Actual insights depend on available data and farm conditions</p>
        </div>
      </div>
    </section>
  );
}
