import { Link } from 'react-router-dom'

export default function PageHeader({
  title,
  subtitle,
  badge,
  altText = 'Already have an account?',
  altLabel = 'Log in',
  altTo = '/login',
}) {
  return (
    <div className="mb-8 text-center">
      {badge && (
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-soft px-4 py-1.5 text-xs font-semibold text-ink">
          <span className="size-1.5 rounded-full bg-primary" />
          {badge}
        </span>
      )}
      <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
        {subtitle}
      </p>
      {altText && (
        <p className="mt-4 text-sm text-ink-soft">
          {altText}{' '}
          <Link to={altTo} className="font-semibold text-primary-dark underline-offset-4 hover:underline">
            {altLabel}
          </Link>
        </p>
      )}
    </div>
  )
}
