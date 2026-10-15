import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LgaMultiSelect from '../components/LgaMultiSelect.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { MAX_LGAS } from '../data/lgas.js'

const EMPTY = { name: '', email: '', password: '', confirm: '', lgas: [] }

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Please enter your full name.'
  if (!values.email.trim()) errors.email = 'Please enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = 'That email address does not look right.'
  if (!values.password) errors.password = 'Please choose a password.'
  else if (values.password.length < 8) errors.password = 'Use at least 8 characters.'
  if (values.confirm !== values.password) errors.confirm = 'Passwords do not match.'
  if (values.lgas.length === 0) errors.lgas = 'Pick at least one local government.'
  else if (values.lgas.length > MAX_LGAS)
    errors.lgas = `You can only pick up to ${MAX_LGAS} local governments.`
  return errors
}

export default function Register() {
  const navigate = useNavigate()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const updateLgas = (lgas) => {
    setValues((current) => ({ ...current, lgas }))
    setErrors((current) => ({ ...current, lgas: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    // Frontend-only phase: persist a demo session, dashboard reads it later.
    sessionStorage.setItem(
      'edh:user',
      JSON.stringify({ name: values.name, email: values.email, lgas: values.lgas }),
    )
    setTimeout(() => navigate('/dashboard'), 600)
  }

  const fieldClass = (error) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink transition outline-none focus:ring-2 focus:ring-primary/40 ${
      error ? 'border-red-400' : 'border-ink/15 focus:border-primary'
    }`

  return (
    <section className="bg-primary-soft py-14 sm:py-20">
      <div className="container-app max-w-lg">
        <PageHeader
          badge="Free forever"
          title="Create your account"
          subtitle="Tell us your Lagos local governments so we can route the right notifications to you."
          altText="Already have an account?"
          altLabel="Log in"
          altTo="/login"
        />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border border-ink/10 bg-white p-6 shadow-xl sm:p-8"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Adaeze Nwosu"
                value={values.name}
                onChange={update('name')}
                className={fieldClass(errors.name)}
              />
              {errors.name && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name}</p>}
            </div>

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
              {errors.email && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={values.password}
                  onChange={update('password')}
                  className={fieldClass(errors.password)}
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{errors.password}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-ink">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat it"
                  value={values.confirm}
                  onChange={update('confirm')}
                  className={fieldClass(errors.confirm)}
                />
                {errors.confirm && (
                  <p className="mt-1.5 text-xs font-medium text-red-500">{errors.confirm}</p>
                )}
              </div>
            </div>

            <LgaMultiSelect value={values.lgas} onChange={updateLgas} error={errors.lgas} />

            <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
              <input type="checkbox" required className="mt-0.5 size-4 accent-primary" />
              I agree to the Terms of Service and Privacy Policy.
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary mt-6 w-full">
            {submitting ? 'Creating your account…' : 'Create account'}
          </button>

          <p className="mt-4 text-center text-xs text-ink-soft">
            Your local governments are only used to match you with your communities.
          </p>
        </form>
      </div>
    </section>
  )
}
