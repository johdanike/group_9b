export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-lg font-black text-ink shadow-sm">
        E
      </span>
      <span className="text-lg font-extrabold tracking-tight text-ink">
        E don happen
      </span>
    </span>
  )
}
