const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

export function databaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function request(path: string, init: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Database is not configured.");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? String((data as {message:string}).message) : "Database request failed.";
    throw new Error(message);
  }
  return data;
}

export const db = {
  get: (table: string, query = "") => request(`${table}${query ? `?${query}` : ""}`),
  insert: (table: string, values: unknown, select = "*") => request(table, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(values) }).then((data) => data),
  update: (table: string, query: string, values: unknown) => request(`${table}?${query}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(values) }),
  delete: (table: string, query: string) => request(`${table}?${query}`, { method: "DELETE" }),
};

export function adminAllowed(pin: string | null) {
  const configured = process.env.ADMIN_PIN;
  return Boolean(configured && pin && pin === configured);
}
