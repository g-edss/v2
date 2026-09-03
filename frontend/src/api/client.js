const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('web360_token');
  const esFormData = options.body instanceof FormData;

  const headers = {
    ...(!esFormData
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  const data =
    res.status === 204
      ? null
      : await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(
      data?.error || `Error ${res.status} en ${path}`
    );

    error.status = res.status;
    throw error;
  }

  return data;
}

async function requestBlob(path) {
  const token = localStorage.getItem('web360_token');

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);

    const error = new Error(
      data?.error || `Error ${res.status} en ${path}`,
    );

    error.status = res.status;
    throw error;
  }

  return res.blob();
}

export const api = {
  get: (p) => request(p),
  getBlob: (p) => requestBlob(p),
  post: (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) }),
  postForm: (p, formData) =>
    request(p, {
      method: 'POST',
      body: formData,
    }),
  put: (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (p, body = {}) => request(p, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (p) => request(p, { method: 'DELETE' }),
};