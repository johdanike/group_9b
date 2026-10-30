const KEY = 'signal:session';
export function session() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || 'null');
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}
export function saveSession(value) {
  sessionStorage.setItem(KEY, JSON.stringify(value));
}
export function logout() {
  sessionStorage.removeItem(KEY);
}

let refreshing;
export async function api(path, options = {}, retry = true) {
  const current = session();
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(current?.accessToken
          ? { Authorization: `Bearer ${current.accessToken}` }
          : {}),
        ...options.headers,
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error(
      'Cannot reach the server. Check that the backend is running.',
    );
  }
  if (
    response.status === 401 &&
    retry &&
    current?.refreshToken &&
    path !== '/auth/refresh'
  ) {
    refreshing ||= api(
      '/auth/refresh',
      { method: 'POST', body: { refreshToken: current.refreshToken } },
      false,
    )
      .then(({ accessToken }) => {
        saveSession({ ...current, accessToken });
      })
      .finally(() => {
        refreshing = undefined;
      });
    try {
      await refreshing;
      return api(path, options, false);
    } catch {
      logout();
      throw new Error('Your session expired. Please sign in again.');
    }
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join('. ')
        : data.message || 'Request failed. Please try again.',
    );
  return data;
}
