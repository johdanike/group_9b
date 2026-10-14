import { LOCATIONS } from '../data/locations.js'

export default function LocationSelect({ id = 'location', value, onChange, error }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        Location
      </label>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-ink-soft"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          required
          className={`w-full appearance-none rounded-xl border bg-white py-3 pr-10 pl-11 text-sm text-ink transition outline-none focus:ring-2 focus:ring-primary/40 ${
            error ? 'border-red-400' : 'border-ink/15 focus:border-primary'
          }`}
        >
          <option value="">Select your location</option>
          {LOCATIONS.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}
