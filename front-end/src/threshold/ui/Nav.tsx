import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { PrimaryButton } from './Buttons';
import TextRoll from './TextRoll';

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link to="/" aria-label="THRESHOLD home" className={`flex items-center gap-2.5 font-medium tracking-[0.22em] text-[#2B2E28] ${className}`}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#1F3D2B" />
        <path d="M7 16.5h10M7 12h10M7 7.5h10" stroke="#FAFAF7" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="10 3" opacity=".9" />
        <circle cx="17.2" cy="7.5" r="1.6" fill="#5FB8C9" />
      </svg>
      <span className="text-[13px]">THRESHOLD</span>
    </Link>
  );
}

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `roll-host rounded-full px-3.5 py-2 text-sm transition-colors duration-150 ${isActive ? 'text-[#1F3D2B]' : 'text-[#5B5F56] hover:text-[#2B2E28]'}`;

/** Site navigation: THRESHOLD, How It Works, Site Intelligence, Log in. */
export default function Nav() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname, loc.hash]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <nav aria-label="Primary" className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between rounded-full border border-[#2B2E28]/10 bg-[#FAFAF7]/90 py-1.5 pl-5 pr-1.5 shadow-[0_1px_0_rgba(43,46,40,0.04)] backdrop-blur-sm">
        <Wordmark />
        <div className="hidden items-center gap-1 md:flex">
          <NavLink to={{ pathname: '/', hash: 'how-it-works' }} className={() => linkCls({ isActive: loc.pathname === '/' && loc.hash === '#how-it-works' })}><TextRoll>How It Works</TextRoll></NavLink>
          <NavLink to="/site-intelligence" className={linkCls}><TextRoll>Site Intelligence</TextRoll></NavLink>
          <PrimaryButton to="/dashboard" size="sm" className="ml-2">Log in</PrimaryButton>
        </div>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full text-[#2B2E28] md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="pointer-events-auto mx-auto mt-2 max-w-5xl rounded-3xl border border-[#2B2E28]/10 bg-[#FAFAF7] p-3 md:hidden">
          <ul className="flex flex-col">
            <li><Link to={{ pathname: '/', hash: 'how-it-works' }} className="block rounded-2xl px-4 py-3 text-[#2B2E28]">How It Works</Link></li>
            <li><Link to="/site-intelligence" className="block rounded-2xl px-4 py-3 text-[#2B2E28]">Site Intelligence</Link></li>
            <li className="p-2"><PrimaryButton to="/dashboard" className="w-full justify-between">Log in</PrimaryButton></li>
          </ul>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[#2B2E28]/10 bg-[#FAFAF7] px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Wordmark />
          <p className="mt-4 text-sm leading-relaxed text-[#5B5F56]">
            Noise control and lower-impact siting for data-center infrastructure. The dashboard and Site Intelligence pages are interactive previews with illustrative data.
          </p>
        </div>
        <ul className="flex flex-col gap-2 text-sm text-[#5B5F56]">
          <li><Link className="roll-host hover:text-[#2B2E28]" to={{ pathname: '/', hash: 'how-it-works' }}><TextRoll>How It Works</TextRoll></Link></li>
          <li><Link className="roll-host hover:text-[#2B2E28]" to="/site-intelligence"><TextRoll>Site Intelligence (preview)</TextRoll></Link></li>
          <li><Link className="roll-host hover:text-[#2B2E28]" to="/dashboard"><TextRoll>Log in to the dashboard (preview)</TextRoll></Link></li>
        </ul>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-xs leading-relaxed text-[#5B5F56]/80">
        Prototype readings are not certified compliance measurements. Nothing on this site claims total data-center energy savings, legal compliance, or proven wildlife recovery.
      </p>
    </footer>
  );
}
