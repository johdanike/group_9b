import { useState } from 'react'

export default function AccordionItem({ question, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-ink/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-semibold text-ink">{question}</span>
        <svg
          viewBox="0 0 24 24"
          className={`size-5 shrink-0 text-primary-dark transition-transform duration-200 ${
            open ? 'rotate-45' : ''
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {open && <div className="pb-5 pr-8 text-sm leading-relaxed text-ink-soft">{children}</div>}
    </div>
  )
}
