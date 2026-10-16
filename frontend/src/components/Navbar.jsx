import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { session } from '../lib/api.js';
import Logo from './Logo.jsx';

const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
];

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return { canInstall: Boolean(deferredPrompt), install };
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { canInstall, install } = useInstallPrompt();
  const { pathname } = useLocation();
  const onLanding = pathname === '/';

  const close = () => setOpen(false);

  const handleClick = (href) => {
    close();
    if (onLanding) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur">
      <nav className="container-app flex h-16 items-center justify-between">
        <Link to="/" onClick={close} aria-label="E don happen home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={onLanding ? link.href : `/${link.href}`}
              onClick={() => handleClick(link.href)}
              className="rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-ink/5 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {canInstall && (
            <button
              type="button"
              onClick={install}
              className="btn-ghost text-sm"
            >
              Install app
            </button>
          )}
          {session() && (
            <NavLink to="/dashboard" className="btn-ghost text-sm">
              Dashboard
            </NavLink>
          )}
          <NavLink to="/login" className="btn-ghost text-sm">
            Login
          </NavLink>
          <NavLink to="/register" className="btn-primary text-sm">
            Sign up
          </NavLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="grid size-10 place-items-center rounded-xl text-ink hover:bg-ink/5 md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink/10 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={onLanding ? link.href : `/${link.href}`}
                onClick={() => handleClick(link.href)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-ink-soft hover:bg-ink/5"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {canInstall && (
              <button
                type="button"
                onClick={install}
                className="btn-outline w-full text-sm"
              >
                Install app
              </button>
            )}
            {session() && (
              <Link to="/dashboard" onClick={close} className="btn-outline">
                Dashboard
              </Link>
            )}
            <Link
              to="/login"
              onClick={close}
              className="btn-outline w-full text-sm"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={close}
              className="btn-primary w-full text-sm"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
