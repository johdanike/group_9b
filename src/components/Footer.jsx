import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

const YEAR = new Date().getFullYear();

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
      // { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "#hero" },
      { label: "Contact", href: "mailto:hello@edonhappen.app" },
      { label: "Careers", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "#faq" },
      { label: "Terms of service", href: "#faq" },
      { label: "Cookie policy", href: "#faq" },
    ],
  },
];

const SOCIALS = [
  {
    label: "X (Twitter)",
    path: "M4 4l7.5 9.5L4.5 20H7l5.4-5.9L16.8 20H20l-7.8-9.9L19.4 4H17l-5 5.5L7.4 4H4z",
  },
  {
    label: "Instagram",
    path: "M12 7.4A4.6 4.6 0 1 0 12 16.6 4.6 4.6 0 0 0 12 7.4zm0 7.6a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM17.4 7a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 4.6c-2 0-2.3 0-3.1.05-.8.04-1.4.17-1.9.36-.5.2-.9.46-1.3.86-.4.4-.66.8-.86 1.3-.19.5-.32 1.1-.36 1.9C4.6 9.7 4.6 10 4.6 12s0 2.3.05 3.1c.04.8.17 1.4.36 1.9.2.5.46.9.86 1.3.4.4.8.66 1.3.86.5.19 1.1.32 1.9.36.8.05 1.1.05 3.1.05s2.3 0 3.1-.05c.8-.04 1.4-.17 1.9-.36.5-.2.9-.46 1.3-.86.4-.4.66-.8.86-1.3.19-.5.32-1.1.36-1.9.05-.8.05-1.1.05-3.1s0-2.3-.05-3.1c-.04-.8-.17-1.4-.36-1.9a3.4 3.4 0 0 0-.86-1.3 3.4 3.4 0 0 0-1.3-.86c-.5-.19-1.1-.32-1.9-.36C14.3 4.6 14 4.6 12 4.6z",
  },
  {
    label: "Facebook",
    path: "M14 9h2.5l.5-3H14V4.3c0-.9.3-1.5 1.6-1.5H17V.2C16.7.16 15.7 0 14.6 0 12.1 0 10.5 1.5 10.5 4.1V6H8v3h2.5v8H14V9z",
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-app py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo className="brightness-0 invert" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Get notified when something happens at your location. E don happen
              — your location-based notification companion.
            </p>
            <div className="mt-5 flex gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href="#hero"
                  aria-label={social.label}
                  className="grid size-9 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-primary hover:text-ink"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="currentColor"
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-white/60 transition hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-white/60 transition hover:text-primary"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row">
          <p>© {YEAR} E don happen. All rights reserved.</p>
          <p>
            Made with <span className="text-primary">♥</span> for people at the
            same place
          </p>
        </div>
      </div>
    </footer>
  );
}
