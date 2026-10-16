import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function readUser() {
  try {
    const stored = JSON.parse(sessionStorage.getItem('edh:user') || 'null')
    if (!stored) return null
    const lgas = Array.isArray(stored.lgas)
      ? stored.lgas
      : stored.location
        ? [stored.location]
        : []
    return { ...stored, lgas }
  } catch {
    sessionStorage.removeItem('edh:user')
    return null
  }
}

const lgaSummary = (lgas = []) =>
  lgas.length === 0
    ? 'No location set'
    : lgas.length <= 2
      ? lgas.join(', ')
      : `${lgas[0]}, ${lgas[1]} +${lgas.length - 2}`

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    name: 'Tunde Balogun',
    text: 'Traffic blocked at Third Mainland Bridge — use Alternate route through Herbert Macaulay.',
    time: '2 min ago',
    initials: 'TB',
  },
  {
    id: 2,
    name: 'Amaka Nwachukwu',
    text: 'Power just got restored in the estate. Thank your neighbours who called in!',
    time: '18 min ago',
    initials: 'AN',
  },
  {
    id: 3,
    name: 'Segun Adeleke',
    text: 'Free community concert starting at the park in 30 minutes. Come through.',
    time: '1 hr ago',
    initials: 'SA',
  },
]

const MOCK_PEOPLE = [
  { name: 'Chiamaka Obi', status: 'Active now', initials: 'CO' },
  { name: 'Musa Danjuma', status: 'Active 5m ago', initials: 'MD' },
  { name: 'Fatima Bello', status: 'Active 22m ago', initials: 'FB' },
]

const TABS = ['Overview', 'Notifications', 'People', 'Profile']

export default function Dashboard() {
  const navigate = useNavigate()
  const [user] = useState(readUser)
  const [activeTab, setActiveTab] = useState('Overview')
  const [dismissed, setDismissed] = useState([])

  const handleLogout = () => {
    sessionStorage.removeItem('edh:user')
    navigate('/')
  }

  const notifications = MOCK_NOTIFICATIONS.filter((item) => !dismissed.includes(item.id))

  return (
    <section className="bg-primary-soft/60 py-10">
      <div className="container-app">
        {/* Topbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary text-lg font-black text-ink">
              {user?.name?.trim()?.[0]?.toUpperCase() ?? 'E'}
            </span>
            <div>
              <p className="text-lg font-bold text-ink">
                {user ? `Hey, ${user.name.split(' ')[0]}` : 'Welcome back'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                <svg
                  viewBox="0 0 24 24"
                  className="size-3.5 text-primary-dark"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {lgaSummary(user?.lgas)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-primary/40 bg-white px-3 py-1.5 text-xs font-semibold text-ink sm:inline-flex">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              Live at your locations
            </span>
            <button type="button" onClick={handleLogout} className="btn-outline text-sm">
              Log out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-ink/10 bg-white p-1.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab ? 'bg-ink text-white' : 'text-ink-soft hover:bg-ink/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Main panel */}
          <div>
            {activeTab === 'Overview' || activeTab === 'Notifications' ? (
              <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-ink">Latest at your locations</h2>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-ink">
                    {notifications.length} new
                  </span>
                </div>

                {notifications.length > 0 ? (
                  <ul className="mt-4 space-y-3">
                    {notifications.map((item) => (
                      <li
                        key={item.id}
                        className="flex gap-3 rounded-2xl border border-ink/10 bg-white p-4 transition hover:border-primary/40"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">
                          {item.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                            <span className="shrink-0 text-xs text-ink-soft">{item.time}</span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.text}</p>
                        </div>
                        <button
                          type="button"
                          aria-label="Dismiss notification"
                          onClick={() => setDismissed((current) => [...current, item.id])}
                          className="size-7 shrink-0 rounded-full text-ink-soft transition hover:bg-ink/10 hover:text-ink"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="mx-auto size-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-ink/20 bg-primary-soft/50 px-6 py-12 text-center">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-ink">
                      <svg
                        viewBox="0 0 24 24"
                        className="size-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8z" />
                        <path d="M10.3 21a2 2 0 0 0 3.4 0" />
                      </svg>
                    </span>
                    <h3 className="mt-4 text-base font-bold text-ink">
                      No notifications yet at your locations
                    </h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                      Nothing has happened around{' '}
                      {user?.lgas?.length ? user.lgas.join(', ') : 'your locations'} recently.
                      As soon as something does, you will see it right here.
                    </p>
                    <div className="mt-5">
                      <Link to="/" className="btn-outline text-sm">
                        Back to home
                      </Link>
                    </div>
                  </div>
                )}

                <p className="mt-5 text-center text-xs text-ink-soft">
                  Demo content — this list will be powered by real notifications soon.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-ink/10 bg-white p-6 text-center shadow-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-ink">
                  <svg viewBox="0 0 24 24" className="size-6 text-primary-dark" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">{activeTab} coming soon</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                  This part of the dashboard lands in the next build — keep an eye out for it.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-ink/10 bg-ink p-6 text-white">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white/70">
                Your locations
              </h2>
              {user?.lgas?.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {user.lgas.map((lga) => (
                    <li
                      key={lga}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-ink"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="size-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      {lga}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xl font-bold">Not set</p>
              )}
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                You receive notifications from up to 3 Lagos local governments. Change them
                later from your profile.
              </p>
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink">People at your locations</h2>
                <span className="text-xs font-semibold text-ink-soft">{MOCK_PEOPLE.length}</span>
              </div>
              <ul className="mt-4 space-y-3">
                {MOCK_PEOPLE.map((person) => (
                  <li key={person.name} className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-primary-soft text-xs font-bold text-ink">
                      {person.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {person.name}
                      </span>
                      <span className="block text-xs text-ink-soft">{person.status}</span>
                    </span>
                    <span className="size-2 rounded-full bg-primary" aria-hidden />
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-center text-xs text-ink-soft">
                Sample members — wired to real users later.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
