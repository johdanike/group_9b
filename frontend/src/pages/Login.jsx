import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'

const EMPTY = { email: '', password: '' }

export default function Login() {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!values.email.trim()) nextErrors.email = 'Please enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      nextErrors.email = 'That email address does not look right.'
    if (!values.password) nextErrors.password = 'Please enter your password.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const stored = JSON.parse(sessionStorage.getItem('edh:user') || 'null')
    sessionStorage.setItem(
      'edh:user',
      JSON.stringify(stored ?? { name: values.email.split('@')[0], email: values.email }),
    )
    setTimeout(() => navigate('/dashboard'), 600)
  }

  const fieldClass = (error) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink transition outline-none focus:ring-2 focus:ring-primary/40 ${
      error ? 'border-red-400' : 'border-ink/15 focus:border-primary'
    }`

  return (
    <section className="bg-primary-soft py-14 sm:py-20">
      <div className="container-app max-w-md">
        <PageHeader
          title="Welcome back"
          subtitle="Log in to pick up where you left off."
          altText="New here?"
          altLabel="Create an account"
          altTo="/register"
        />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xl sm:p-8"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={update('email')}
                className={fieldClass(errors.email)}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={values.password}
                onChange={update('password')}
                className={fieldClass(errors.password)}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-ink-soft">
                <input type="checkbox" className="size-4 accent-primary" /> Remember me
              </label>
              <a
                href="mailto:support@edonhappen.app"
                className="font-semibold text-primary-dark underline-offset-4 hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full">
            {submitting ? 'Logging you in…' : 'Log in'}
          </button>
        </form>
      </div>
    </section>
  )
}
