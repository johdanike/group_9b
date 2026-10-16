import { useState } from 'react'
import { LAGOS_LGAS, MAX_LGAS } from '../data/lgas.js'

export default function LgaMultiSelect({ value = [], onChange, error }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const atMax = value.length >= MAX_LGAS
  const filtered = LAGOS_LGAS.filter((lga) =>
    lga.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const toggle = (lga) => {
    if (value.includes(lga)) {
      onChange(value.filter((item) => item !== lga))
    } else if (!atMax) {
      onChange([...value, lga])
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label className="block text-sm font-medium text-ink">
          Local government area{MAX_LGAS > 1 ? 's' : ''}
        </label>
        <span
          className={`text-xs font-semibold ${atMax ? 'text-primary-dark' : 'text-ink-soft'}`}
        >
          {value.length}/{MAX_LGAS} selected
        </span>
      </div>

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 text-left text-sm transition outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? 'border-red-400' : 'border-ink/15 focus:border-primary'
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <svg
            viewBox="0 0 24 24"
            className="size-5 shrink-0 text-ink-soft"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span className={value.length ? 'truncate font-medium text-ink' : 'text-ink-soft'}>
            {value.length ? value.join(', ') : 'Select up to 3 local governments'}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setOpen(false)
              setQuery('')
            }}
            aria-hidden
          />
          <div className="relative z-20 mt-2 overflow-hidden rounded-2xl border border-ink/15 bg-white shadow-xl">
            <div className="border-b border-ink/10 p-3">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search local governments…"
                className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-ink-soft">
                  No local government matches “{query}”.
                </li>
              )}
              {filtered.map((lga) => {
                const selected = value.includes(lga)
                const disabled = !selected && atMax
                return (
                  <li key={lga}>
                    <button
                      type="button"
                      onClick={() => toggle(lga)}
                      disabled={disabled}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        disabled
                          ? 'cursor-not-allowed text-ink/30'
                          : 'text-ink hover:bg-primary-soft'
                      } ${selected ? 'bg-primary-soft font-semibold' : ''}`}
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-md border-2 transition ${
                          selected
                            ? 'border-primary bg-primary text-ink'
                            : 'border-ink/25 bg-white'
                        } ${disabled ? 'opacity-40' : ''}`}
                      >
                        {selected && (
                          <svg
                            viewBox="0 0 24 24"
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {lga}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-ink/10 bg-primary-soft/50 px-4 py-3">
              <p className="text-xs text-ink-soft">
                {atMax
                  ? `Maximum of ${MAX_LGAS} reached — remove one to swap.`
                  : `You can pick ${MAX_LGAS - value.length} more.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setQuery('')
                }}
                className="btn-primary !px-4 !py-1.5 !text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((lga) => (
            <span
              key={lga}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary-soft py-1 pr-1.5 pl-3 text-xs font-semibold text-ink"
            >
              {lga}
              <button
                type="button"
                onClick={() => toggle(lga)}
                aria-label={`Remove ${lga}`}
                className="grid size-5 place-items-center rounded-full text-ink-soft transition hover:bg-ink/10 hover:text-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}
