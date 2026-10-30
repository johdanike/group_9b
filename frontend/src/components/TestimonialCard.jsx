export default function TestimonialCard({ quote, name, role, initials }) {
  return (
    <figure className="flex h-full flex-col rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_1px_2px_rgba(48,50,52,0.06)]">
      <div className="flex gap-1 text-primary" aria-label="5 out of 5 stars">
        {Array.from({ length: 5 }).map((_, index) => (
          <svg key={index} viewBox="0 0 20 20" className="size-4" fill="currentColor">
            <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
          </svg>
        ))}
      </div>
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">
        “{quote}”
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-ink text-xs font-bold text-white">
          {initials}
        </span>
        <span>
          <span className="block text-sm font-semibold text-ink">{name}</span>
          <span className="block text-xs text-ink-soft">{role}</span>
        </span>
      </figcaption>
    </figure>
  )
}
