import { useEffect, useState } from 'react';
import { enablePush, disablePush, pushStatus, testPush } from '../lib/push.js';

export default function PhoneNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    pushStatus()
      .then(setEnabled)
      .catch(() => {});
  }, []);
  async function run(work) {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await work();
      setEnabled(await pushStatus());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-2xl border border-ink/10 bg-primary-soft/50 p-4">
      <h3 className="font-bold">Phone notifications</h3>
      <p className="mt-2 text-sm text-ink-soft">
        Allow alerts on this device for new reports matching your saved
        categories and radius, including when the app is in the background.
      </p>
      <p className="mt-2 text-xs text-ink-soft">
        On iPhone: Safari → Share → Add to Home Screen. Open that app icon, then
        enable notifications here. An HTTPS link and internet access are
        required.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="btn-primary"
          disabled={busy}
          onClick={() =>
            run(async () => {
              if (enabled) {
                await disablePush();
                setMessage('Phone notifications disabled on this device.');
              } else {
                await enablePush();
                setMessage(
                  'Phone notifications enabled. Try a test notification.',
                );
              }
            })
          }
        >
          {busy
            ? 'Please wait...'
            : enabled
              ? 'Disable phone notifications'
              : 'Enable phone notifications'}
        </button>
        {enabled && (
          <button
            className="btn-outline"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const result = await testPush();
                setMessage(result.message);
              })
            }
          >
            Send test notification
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="mt-3 text-sm text-green-800">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
