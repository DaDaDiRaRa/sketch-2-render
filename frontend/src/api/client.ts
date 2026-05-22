// In production (single container) requests go to same origin — BASE_URL is ''.
// In local dev, set VITE_API_URL=http://localhost:8000 in frontend/.env.local.
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? 'API error');
  }

  return res.json() as Promise<T>;
}
