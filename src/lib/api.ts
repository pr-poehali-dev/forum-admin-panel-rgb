export const FORUM_API = "https://functions.poehali.dev/476da6b3-5cee-497b-9115-64bdf6d8620a";
export const AUTH_API = "https://functions.poehali.dev/7d3c22f6-fa6b-4ef9-98d9-1a9856700d55";
export const ADMIN_API = "https://functions.poehali.dev/1396a4a5-202b-4881-85bd-2942ba42e62b";

const SESSION_KEY = "forum_session_id";

export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionId(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearSessionId(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function apiFetch(
  baseUrl: string,
  path: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const sid = getSessionId();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (sid) headers["X-Session-Id"] = sid;

  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}
