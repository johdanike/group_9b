export default function FeatureCard({ icon, title, children }) {
  return (
    <article className="rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_1px_2px_rgba(48,50,52,0.06)] transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-ink">
        <svg
          viewBox="0 0 24 24"
          className="size-6 text-primary-dark"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </span>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</p>
    </article>
  )
}
