import { api } from './api.js';

function supported() {
  if (!window.isSecureContext)
    throw new Error(
      'Open the HTTPS sharing link to enable phone notifications.',
    );
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    throw new Error(
      'This browser does not support Web Push here. On iPhone, add the app to your Home Screen and open it from its icon first.',
    );
  }
}
async function registration() {
  const registered = await navigator.serviceWorker.getRegistration();
  if (!registered?.active)
    throw new Error(
      'Installable app is still loading. Reload once, or use the built PWA sharing link.',
    );
  return navigator.serviceWorker.ready;
}
export async function pushStatus() {
  if (
    !window.isSecureContext ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  )
    return false;
  const registered = await navigator.serviceWorker.getRegistration();
  return Boolean(
    registered && (await registered.pushManager.getSubscription()),
  );
}
export async function enablePush() {
  supported();
  // Request permission directly from the user's click, before network calls (Safari requirement).
  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    throw new Error(
      'Notifications were not allowed. You can change this in your browser or phone settings.',
    );
  const registered = await registration();
  const config = await api('/notifications/push/config');
  if (!config.enabled)
    throw new Error('Phone notifications are not configured on the server.');
  const padded = config.publicKey.replace(/-/g, '+').replace(/_/g, '/');
  const key = Uint8Array.from(
    atob(padded + '='.repeat((4 - (padded.length % 4)) % 4)),
    (c) => c.charCodeAt(0),
  );
  const subscription =
    (await registered.pushManager.getSubscription()) ||
    (await registered.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    }));
  const json = subscription.toJSON();
  await api('/notifications/push/devices', {
    method: 'POST',
    body: { endpoint: json.endpoint, keys: json.keys },
  });
  return true;
}
export async function disablePush() {
  if (!('serviceWorker' in navigator)) return;
  const registered = await navigator.serviceWorker.getRegistration();
  const subscription =
    registered && (await registered.pushManager.getSubscription());
  if (!subscription) return;
  // Local unsubscribe still runs if the API is unavailable during sign-out.
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await api('/notifications/push/devices', {
    method: 'DELETE',
    body: { endpoint },
  });
}
export async function testPush() {
  supported();
  const registered = await registration();
  const subscription = await registered.pushManager.getSubscription();
  if (!subscription)
    throw new Error('Enable notifications on this device first.');
  return api('/notifications/push/test', {
    method: 'POST',
    body: { endpoint: subscription.endpoint },
  });
}

export async function restorePushForCurrentUser() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription =
    registration && (await registration.pushManager.getSubscription());
  if (subscription) {
    const json = subscription.toJSON();
    await api('/notifications/push/devices', {
      method: 'POST',
      body: { endpoint: json.endpoint, keys: json.keys },
    });
  }
}
