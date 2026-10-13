import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { label: 'What it helps with', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Our promise', href: '#about' },
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5EBE1] bg-[#FCFDFB]/95 backdrop-blur">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3.5 sm:px-8 lg:px-14" aria-label="Primary">
        <a href="/" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B] focus-visible:ring-offset-2" aria-label="Puthumai Ulavan home">
          <img src="/assets/image.png" alt="" className="h-11 w-11 rounded-full object-contain" />
          <span className="leading-tight">
            <span className="block font-display text-base font-bold tracking-tight text-[#193D29]">புதுமை உழவன்</span>
            <span className="mt-0.5 block text-[9px] font-bold tracking-[0.2em] text-[#63816A]">PUTHUMAI UZHAVAN</span>
            <span className="mt-1 hidden text-[10px] font-medium text-[#738173] sm:block">Technology that supports farmers</span>
          </span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="rounded text-sm font-medium text-[#5F6F62] transition hover:text-[#28633B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B] focus-visible:ring-offset-4">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <a href="/login" className="rounded text-sm font-semibold text-[#31583D] transition hover:text-[#1D4F2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B] focus-visible:ring-offset-4">Sign in</a>
          <a href="/signup" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#28633B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4F2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B] focus-visible:ring-offset-2">
            Create your farm profile <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <button type="button" className="grid h-11 w-11 place-items-center rounded-lg border border-[#DDE6D9] bg-white text-[#28543A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B] focus-visible:ring-offset-2 md:hidden" onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-navigation">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-navigation" className="border-t border-[#E5EBE1] bg-[#FCFDFB] px-5 py-4 md:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-[#425B49] transition hover:bg-[#F0F5ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28633B]">{link.label}</a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[#E5EBE1] pt-4">
              <a href="/login" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#D6E0D3] px-4 text-sm font-semibold text-[#31583D]">Sign in</a>
              <a href="/signup" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#28633B] px-4 text-sm font-semibold text-white">Create profile</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
