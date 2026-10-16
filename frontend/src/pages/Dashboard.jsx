import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, logout, session } from '../lib/api.js';
import { AREAS, CATEGORIES, STATUS_HELP } from '../data/areas.js';

const field =
  'w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary';
const panel = 'rounded-3xl border border-ink/10 bg-white p-5 shadow-sm sm:p-6';
function when(value) {
  return new Date(value).toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  });
}
function Badge({ state }) {
  const color =
    state === 'verified'
      ? 'bg-green-100 text-green-800'
      : state === 'disputed'
        ? 'bg-red-100 text-red-800'
        : state === 'corroborated'
          ? 'bg-blue-100 text-blue-800'
          : 'bg-amber-100 text-amber-800';
  return (
    <span
      title={STATUS_HELP[state]}
      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${color}`}
    >
      {state}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [area, setArea] = useState('Yaba');
  const [radius, setRadius] = useState(5);
  const [category, setCategory] = useState('');
  const [tab, setTab] = useState('Nearby');
  const [reports, setReports] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    category: 'traffic',
    description: '',
    observedAt: '',
  });
  const [reason, setReason] = useState('');
  const [initialized, setInitialized] = useState(false);
  const current = session();
  const moderator = ['moderator', 'super_admin'].includes(profile?.role);

  const load = useCallback(async () => {
    if (!session()) return;
    const query = new URLSearchParams({
      ...AREAS[area],
      radius: radius * 1000,
      limit: 100,
    });
    if (category) query.set('category', category);
    const [p, feed, notifications, prefs] = await Promise.all([
      api('/auth/profile'),
      api(`/reports?${query}`),
      api('/notifications/inbox'),
      api('/notifications/subscriptions'),
    ]);
    setProfile(p);
    setReports(feed);
    setInbox(notifications);
    setSubscriptions(prefs);
    if (['moderator', 'super_admin'].includes(p.role))
      setQueue(await api('/moderation/queue'));
    return p;
  }, [area, radius, category]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    load()
      .then((p) => {
        if (active && !initialized && p) {
          setInitialized(true);
          if (AREAS[p.lgas?.[0]]) setArea(p.lgas[0]);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [load, initialized]);

  useEffect(() => {
    const timer = setInterval(() => load().catch(() => {}), 20000);
    return () => clearInterval(timer);
  }, [load]);

  if (!current) return <Navigate to="/login" replace />;

  async function act(work, message) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await work();
      await load();
      if (message) setNotice(message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function publish(event) {
    event.preventDefault();
    await act(async () => {
      const report = await api('/reports', {
        method: 'POST',
        body: {
          category: form.category,
          description: form.description,
          location: { ...AREAS[area], areaName: area, radius: 1000 },
          ...(form.observedAt
            ? { observedAt: new Date(form.observedAt).toISOString() }
            : {}),
        },
      });
      setForm({ category: 'traffic', description: '', observedAt: '' });
      setSelected(report);
      setTab('Nearby');
    }, 'Report saved. It starts as unverified until independent review.');
  }
  async function vote(report, action) {
    if (
      action === 'confirm' &&
      !window.confirm(
        'Did you personally witness this incident? Confirm only firsthand observations.',
      )
    )
      return;
    await act(async () => {
      const updated = await api('/reports/confirm', {
        method: 'POST',
        body: { reportId: report.id, action, firsthand: action === 'confirm' },
      });
      if (selected?.id === report.id) setSelected(updated);
    }, 'Your contribution was saved. Each account has one vote per report.');
  }
  async function openReport(id) {
    await act(async () => setSelected(await api(`/reports/${id}`)));
  }
  async function moderate(report, newState) {
    await act(async () => {
      await api('/moderation/actions', {
        method: 'POST',
        body: {
          targetId: report.id,
          targetType: 'report',
          action:
            newState === 'verified'
              ? 'approve'
              : newState === 'removed'
                ? 'remove'
                : 'label',
          newState,
          reason,
        },
      });
      setReason('');
      setSelected(null);
    }, `Report marked ${newState}. An audit record was saved.`);
  }
  async function toggleCategory(cat) {
    const existing = subscriptions.some((s) => s.category === cat);
    await act(
      () =>
        api(`/notifications/subscriptions${existing ? `/${cat}` : ''}`, {
          method: existing ? 'DELETE' : 'POST',
          ...(!existing
            ? {
                body: {
                  category: cat,
                  areaOrRadius: radius,
                  ...AREAS[area],
                  priorityThreshold: 'normal',
                },
              }
            : {}),
        }),
      `${cat} notifications ${existing ? 'disabled' : 'enabled'} for this account.`,
    );
  }
  const unread = inbox.filter((n) => n.deliveryState !== 'acknowledged').length;
  const tabs = [
    'Nearby',
    'Report',
    'My reports',
    'Notifications',
    'Preferences',
    ...(moderator ? ['Moderation'] : []),
  ];
  const items =
    tab === 'Moderation'
      ? queue
      : tab === 'My reports'
        ? reports.filter((r) => r.reporterId === profile?.id)
        : reports;

  function card(report) {
    const own = report.reporterId === profile?.id;
    return (
      <article key={report.id} className={panel}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
            {report.category} |{' '}
            {report.areaName || report.metadata?.areaName || 'Lagos'}
          </span>
          <Badge state={report.state} />
        </div>
        <button
          className="mt-3 block text-left text-lg font-bold leading-relaxed hover:underline"
          onClick={() => openReport(report.id)}
        >
          {report.description}
        </button>
        <p className="mt-2 text-xs text-ink-soft">
          Observed {when(report.observedAt)} | Posted {when(report.submittedAt)}
        </p>
        <p className="mt-3 text-xs text-ink-soft">
          {STATUS_HELP[report.state] || 'Awaiting review.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
          <span className="text-sm font-semibold">
            {report.reporter?.displayName ||
              (own ? profile.displayName : 'Resident')}
            {report.reporter?.trustedContributor && (
              <span
                className="ml-2 rounded-full bg-primary-soft px-2 py-1 text-xs text-primary-dark"
                title="At least 10 currently moderator-verified reports"
              >
                Trusted contributor
              </span>
            )}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-full border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"
              disabled={
                busy ||
                own ||
                ['removed', 'resolved', 'stale'].includes(report.state)
              }
              onClick={() => vote(report, 'confirm')}
            >
              Confirm firsthand | {report.confirmationsCount || 0}
            </button>
            <button
              className="rounded-full border border-ink/15 px-3 py-2 text-xs font-bold disabled:opacity-40"
              disabled={
                busy ||
                own ||
                ['removed', 'resolved', 'stale'].includes(report.state)
              }
              onClick={() => vote(report, 'dispute')}
            >
              Dispute | {report.disputesCount || 0}
            </button>
          </div>
        </div>
        {own && (
          <p className="mt-2 text-xs text-ink-soft">
            Your report | other residents can confirm or dispute it.
          </p>
        )}
      </article>
    );
  }

  return (
    <section className="min-h-screen bg-primary-soft/50 py-8">
      <div className="container-app">
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <strong>Local pilot demo</strong> | Seeded reports are illustrative.
          In-app notifications are saved locally; external push/SMS and
          emergency response are not connected.
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary-dark">
              Your neighbourhood, in the know
            </p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Hello, {profile?.displayName || 'neighbour'}.
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Fresh observations. Clear confidence. A more informed community.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-outline"
              disabled={busy}
              onClick={() => act(load, 'Feed refreshed.')}
            >
              Refresh
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav
          aria-label="Dashboard"
          className="my-7 flex gap-2 overflow-x-auto pb-2"
        >
          {tabs.map((t) => (
            <button
              key={t}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold ${tab === t ? 'bg-ink text-white' : 'bg-white text-ink'}`}
              onClick={() => {
                setTab(t);
                setSelected(null);
              }}
            >
              {t}
              {t === 'Notifications' && unread > 0 ? ` (${unread})` : ''}
            </button>
          ))}
        </nav>
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-green-200 bg-white p-4 text-sm text-green-800"
          >
            {notice}
          </p>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_290px]">
          <div className="min-w-0 space-y-5">
            <div className={`${panel} grid gap-3 sm:grid-cols-3`}>
              <label className="text-xs font-bold">
                Area
                <select
                  aria-label="Feed area"
                  className={`${field} mt-2`}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  {Object.keys(AREAS).map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Radius
                <select
                  className={`${field} mt-2`}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                >
                  {[1, 3, 5, 10, 25].map((r) => (
                    <option key={r} value={r}>
                      {r} km
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold">
                Category
                <select
                  className={`${field} mt-2`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            {selected && (
              <div className="space-y-3 rounded-3xl border-2 border-primary p-3">
                <div className="flex items-center justify-between px-2">
                  <h2 className="font-bold">Report detail</h2>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-sm underline"
                  >
                    Close detail
                  </button>
                </div>
                {card(selected)}
                <p className="px-3 text-xs text-ink-soft">
                  Approximate location |{' '}
                  {selected.coordinates?.coordinates?.join(', ')}. Exact
                  coordinates and private contact details are hidden from the
                  public feed.
                </p>
                {moderator && selected.reporterId !== profile?.id && (
                  <div className={panel}>
                    <label className="text-sm font-bold">
                      Moderation reason
                      <textarea
                        className={`${field} mt-2`}
                        minLength={10}
                        maxLength={1000}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Explain what you reviewed (at least 10 characters)"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['verified', 'resolved', 'removed'].map((state) => (
                        <button
                          key={state}
                          className="btn-outline capitalize"
                          disabled={
                            busy ||
                            reason.trim().length < 10 ||
                            selected.state === state ||
                            (state === 'resolved' &&
                              !['verified', 'corroborated', 'stale'].includes(
                                selected.state,
                              ))
                          }
                          onClick={() => moderate(selected, state)}
                        >
                          Mark {state}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {['Nearby', 'My reports', 'Moderation'].includes(tab) && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    {tab === 'Moderation'
                      ? 'Awaiting review'
                      : tab === 'My reports'
                        ? 'Your contributions in this area'
                        : `Around ${area}`}
                  </h2>
                  <span className="text-sm text-ink-soft">
                    {items.length} reports
                  </span>
                </div>
                {loading ? (
                  <p className={panel}>Loading the local feed...</p>
                ) : items.length ? (
                  items.map(card)
                ) : (
                  <div className={`${panel} py-12 text-center`}>
                    <h3 className="text-lg font-bold">
                      No reports in this view
                    </h3>
                    <p className="mt-2 text-sm text-ink-soft">
                      Try another area or category, or share a local
                      observation.
                    </p>
                    <button
                      className="btn-primary mt-5"
                      onClick={() => setTab('Report')}
                    >
                      Create a report
                    </button>
                  </div>
                )}
              </>
            )}
            {tab === 'Report' && (
              <form onSubmit={publish} className={`${panel} space-y-5`}>
                <div>
                  <h2 className="text-xl font-bold">What did you observe?</h2>
                  <p className="mt-2 text-sm text-ink-soft">
                    Share facts about {area}. Your report starts as unverified.
                    Avoid names, private addresses, or speculation.
                  </p>
                </div>
                <label className="block text-sm font-bold">
                  Incident category
                  <select
                    className={`${field} mt-2`}
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-bold">
                  Description
                  <textarea
                    className={`${field} mt-2 min-h-32`}
                    required
                    minLength={10}
                    maxLength={1500}
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="For example: Slow-moving traffic near the Yaba bus stop after heavy rain."
                  />
                </label>
                <label className="block text-sm font-bold">
                  Observed time{' '}
                  <span className="font-normal text-ink-soft">
                    (leave blank for now)
                  </span>
                  <input
                    className={`${field} mt-2`}
                    type="datetime-local"
                    value={form.observedAt}
                    onChange={(e) =>
                      setForm({ ...form, observedAt: e.target.value })
                    }
                  />
                </label>
                <div className="rounded-xl bg-primary-soft p-4 text-sm">
                  Public preview: {area} | approximate area centre |{' '}
                  {form.category} | Unverified
                </div>
                <button disabled={busy} className="btn-primary">
                  {busy ? 'Saving...' : 'Publish report'}
                </button>
              </form>
            )}
            {tab === 'Notifications' && (
              <div className={panel}>
                <h2 className="text-xl font-bold">Your local inbox</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  New reports matching your saved area, radius and categories.
                  Updates appear every 20 seconds or when you refresh.
                </p>
                <div className="mt-5 space-y-3">
                  {inbox.length ? (
                    inbox.map((n) => (
                      <article
                        key={n.id}
                        className={`rounded-2xl border p-4 ${n.deliveryState === 'acknowledged' ? 'border-ink/10' : 'border-primary bg-primary-soft'}`}
                      >
                        <h3 className="font-bold">
                          {n.payload?.title || 'Local report update'}
                        </h3>
                        <p className="mt-2 text-sm">{n.payload?.body}</p>
                        <p className="mt-2 text-xs text-ink-soft">
                          {when(n.createdAt)} |{' '}
                          {n.deliveryState === 'acknowledged' ? 'Read' : 'New'}
                        </p>
                        <div className="mt-3 flex gap-4">
                          <button
                            className="text-sm font-bold underline"
                            onClick={() =>
                              openReport(
                                n.payload?.reportId || n.incidentIdOrSosId,
                              )
                            }
                          >
                            Open report
                          </button>
                          {n.deliveryState !== 'acknowledged' && (
                            <button
                              className="text-sm underline"
                              disabled={busy}
                              onClick={() =>
                                act(() =>
                                  api(`/notifications/inbox/${n.id}/read`, {
                                    method: 'PUT',
                                  }),
                                )
                              }
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="py-10 text-center text-ink-soft">
                      No matching reports yet. Save your preferences, then
                      publish from a second account.
                    </p>
                  )}
                </div>
              </div>
            )}
            {tab === 'Preferences' && (
              <div className={`${panel} space-y-5`}>
                <h2 className="text-xl font-bold">Notification preferences</h2>
                <p className="text-sm text-ink-soft">
                  Choose categories below. New subscriptions use the area and
                  radius selected above.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {CATEGORIES.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 rounded-xl border border-ink/10 p-3 text-sm capitalize"
                    >
                      <input
                        type="checkbox"
                        checked={subscriptions.some((s) => s.category === cat)}
                        onChange={() => toggleCategory(cat)}
                        disabled={busy}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
                <button
                  className="btn-primary"
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await api('/auth/profile', {
                        method: 'PUT',
                        body: { lgas: [area] },
                      });
                      await Promise.all(
                        subscriptions.map((s) =>
                          api(`/notifications/subscriptions/${s.category}`, {
                            method: 'PUT',
                            body: { areaOrRadius: radius, ...AREAS[area] },
                          }),
                        ),
                      );
                    }, `Saved ${area} within ${radius} km for enabled notifications.`)
                  }
                >
                  Save area and radius
                </button>
                <div className="text-xs text-ink-soft">
                  {subscriptions.map((s) => (
                    <p key={s.category}>
                      {s.category}: {s.areaOrRadius} km around{' '}
                      {Number(s.latitude || 6.5244).toFixed(2)},{' '}
                      {Number(s.longitude || 3.3792).toFixed(2)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
          <aside className="space-y-5">
            <div className="rounded-3xl bg-ink p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">
                Your contribution
              </p>
              <h2 className="mt-3 text-xl font-bold">
                {profile?.trustedContributor
                  ? 'Trusted contributor'
                  : 'Building local trust'}
              </h2>
              <p className="mt-3 text-sm text-white/75">
                {profile?.verifiedReports || 0} / 10 moderator-verified reports
              </p>
              <progress
                className="mt-4 w-full accent-primary"
                max={10}
                value={Math.min(profile?.verifiedReports || 0, 10)}
              />
              <p className="mt-3 text-xs leading-relaxed text-white/60">
                Earn the badge through ten currently verified reports. It
                reflects contribution history; every new report still needs its
                own review.
              </p>
            </div>
            <div className={panel}>
              <h2 className="font-bold">Confidence, explained</h2>
              <dl className="mt-4 space-y-4">
                {['unverified', 'corroborated', 'verified', 'disputed'].map(
                  (state) => (
                    <div key={state}>
                      <dt>
                        <Badge state={state} />
                      </dt>
                      <dd className="mt-2 text-xs leading-relaxed text-ink-soft">
                        {STATUS_HELP[state]}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </div>
            <div className={panel}>
              <h2 className="font-bold">Pilot scope</h2>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                Manual area selection keeps the feed useful without location
                permission. Reports use approximate area centres. SOS is
                deferred until responder coverage is agreed and tested.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
