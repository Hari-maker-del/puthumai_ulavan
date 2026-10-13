export default function Footer() {
  const linkClass = "text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 rounded";

  return (
    <footer className="border-t border-brand-100 bg-brand-950 py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-4 lg:px-12">
        <div className="md:col-span-1">
          <a href="/" className="flex items-center gap-3" aria-label="Puthumai Uzhavan home">
            <img src="/assets/image.png" alt="" className="h-11 w-11 rounded-full bg-white object-contain" />
            <span>
              <span className="block font-display text-base font-bold">புதுமை உழவன்</span>
              <span className="block text-[10px] font-semibold tracking-[0.2em] text-brand-300">PUTHUMAI UZHAVAN</span>
            </span>
          </a>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            <span className="font-semibold text-white/90">உழவரின் அறிவுக்கு, தொழில்நுட்பத்தின் துணை.</span>
            <span className="mt-2 block">Technology that supports farmers. Practical tools for crop planning, farm records and more considered decisions.</span>
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Explore</h3>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm">
            <a href="/#features" className={linkClass}>What it helps with</a>
            <a href="/#how-it-works" className={linkClass}>How it works</a>
            <a href="/#pricing" className={linkClass}>Plans</a>
            <a href="/#about" className={linkClass}>Our promise</a>
            <a href="/pages" className={linkClass}>All website pages</a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Help & support</h3>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm">
            <a href="/help" className={linkClass}>Help center</a>
            <a href="/faq" className={linkClass}>FAQs</a>
            <a href="/contact" className={linkClass}>Contact us</a>
            <a href="/offline" className={linkClass}>Offline help</a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Your farm journey</h3>
          <p className="mt-4 text-sm leading-6 text-white/60">Start with the farm details you know. Review guidance carefully and combine it with your own experience and local expertise.</p>
          <div className="mt-4 flex flex-col items-start gap-3 text-sm">
            <a href="/login" className={linkClass}>Sign in</a>
            <a href="/signup" className="rounded-xl bg-brand-500 px-4 py-2 font-semibold text-white transition hover:bg-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300">Create your farm profile</a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-white/10 px-5 pt-6 text-xs text-white/45 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <span>© {new Date().getFullYear()} Puthumai Uzhavan. Built with farmers in mind.</span>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
          <a href="/privacy" className={linkClass}>Privacy policy</a>
          <a href="/terms" className={linkClass}>Terms</a>
          <a href="/cookies" className={linkClass}>Cookie preferences</a>
          <a href="/accessibility" className={linkClass}>Accessibility</a>
        </nav>
      </div>
    </footer>
  );
}
