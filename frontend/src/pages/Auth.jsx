import { restorePushForCurrentUser } from '../lib/push.js';
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, saveSession } from '../lib/api.js';
import { AREAS, CATEGORIES } from '../data/areas.js';

export default function Auth({ register = false }) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [area, setArea] = useState('Yaba');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const normalized = phone
        .trim()
        .replace(/[\s()-]/g, '')
        .replace(/^0(?=\d{10}$)/, '+234');
      if (!/^\+[1-9]\d{7,14}$/.test(normalized))
        throw new Error(
          'Enter a phone number such as 08012345678 or +2348012345678.',
        );
      if (!sent) {
        if (register && (!consent || name.trim().length < 2))
          throw new Error(
            'Enter your name and acknowledge the local demo notice.',
          );
        await api('/auth/send-otp', {
          method: 'POST',
          body: { phone: normalized },
        });
        setSent(true);
      } else {
        const result = await api('/auth/verify-otp', {
          method: 'POST',
          body: { phone: normalized, otp },
        });
        saveSession(result);
        await restorePushForCurrentUser().catch(() => {});
        if (register) {
          await api('/auth/profile', {
            method: 'PUT',
            body: { displayName: name.trim(), lgas: [area] },
          });
          // Default subscriptions can be changed individually in the dashboard.
          await Promise.all(
            CATEGORIES.map((category) =>
              api('/notifications/subscriptions', {
                method: 'POST',
                body: {
                  category,
                  areaOrRadius: 5,
                  ...AREAS[area],
                  priorityThreshold: 'normal',
                },
              }),
            ),
          );
        }
        navigate(`/dashboard${search}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const field =
    'mt-2 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-primary';
  return (
    <section className="bg-primary-soft py-14 sm:py-20">
      <div className="container-app max-w-lg">
        <p className="text-sm font-bold text-primary-dark">
          E don happen · Lagos pilot
        </p>
        <h1 className="mt-3 text-4xl font-extrabold">
          {register ? 'Join your neighbourhood' : 'Welcome back'}
        </h1>
        <p className="mt-3 text-ink-soft">
          Phone verification connects you to the real local feed.
        </p>
        {!register && (
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              ['Ada', '1'],
              ['Tunde', '2'],
              ['Zainab', '3'],
              ['Moderator', '4'],
            ].map(([label, id]) => (
              <button
                type="button"
                key={id}
                className="rounded-full border border-ink/15 bg-white px-3 py-2 text-xs font-semibold"
                onClick={() => {
                  setPhone(`+234800000000${id}`);
                  setSent(false);
                  setOtp('');
                }}
              >
                {label} | sample account
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={submit}
          className="mt-8 space-y-5 rounded-3xl border border-ink/10 bg-white p-7 shadow-xl"
        >
          {register && (
            <>
              <label className="block text-sm font-semibold">
                Display name
                <input
                  className={field}
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={sent}
                  autoComplete="nickname"
                />
              </label>
              <label className="block text-sm font-semibold">
                Your area
                <select
                  className={field}
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  disabled={sent}
                >
                  {Object.keys(AREAS).map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="block text-sm font-semibold">
            Phone number
            <input
              className={field}
              required
              type="tel"
              autoComplete="tel"
              placeholder="08012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={sent}
            />
          </label>
          {register && !sent && (
            <label className="flex gap-2 text-xs leading-relaxed text-ink-soft">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              I understand this is a local demonstration. Reports are community
              observations and are not guaranteed facts.
            </label>
          )}
          {sent && (
            <>
              <p className="rounded-xl bg-primary-soft p-4 text-sm">
                Verification requested. Ask the demo host for your six-digit
                code.
              </p>
              <label className="block text-sm font-semibold">
                Six-digit code
                <input
                  className={field}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </label>
            </>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <button className="btn-primary w-full" disabled={busy}>
            {busy
              ? 'Please wait…'
              : sent
                ? 'Verify and continue'
                : 'Get verification code'}
          </button>
          {sent && (
            <button
              type="button"
              className="w-full text-sm underline"
              onClick={() => {
                setSent(false);
                setOtp('');
                setError('');
              }}
            >
              Change number / request a fresh code
            </button>
          )}
          <p className="text-center text-sm text-ink-soft">
            {register ? 'Already joined? ' : 'New here? '}
            <Link
              className="font-bold text-primary-dark"
              to={register ? '/login' : '/register'}
            >
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}
