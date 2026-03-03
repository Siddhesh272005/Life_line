import { API_BASE_URL } from '../config/runtime';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const getBaseUrl = () => API_BASE_URL;

const buildHeaders = (extra?: Record<string, string>) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
};

const request = async (path: string, init: RequestInit) => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, init);
    return handleResponse(res);
  } catch (error: any) {
    const raw = typeof error?.message === 'string' ? error.message : '';
    const lower = raw.toLowerCase();
    if (
      lower.includes('network request failed') ||
      lower.includes('failed to fetch') ||
      lower.includes('networkerror')
    ) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    throw error instanceof Error ? error : new Error('Request failed');
  }
};

export const apiGet = async (path: string) => {
  return request(path, {
    method: 'GET',
    headers: buildHeaders(),
  });
};

export const apiPost = async (path: string, body: any) => {
  return request(path, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
};

export const apiPut = async (path: string, body: any) => {
  return request(path, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
};

export const apiDelete = async (path: string) => {
  return request(path, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
};

export const apiUpload = async (path: string, form: FormData) => {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: form,
  });
  return handleResponse(res);
};
