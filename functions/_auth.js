// Shared auth helpers for Tadmur admin API (Cloudflare Pages Functions)

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function makeSessionCookie(env, email) {
  const secret = env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
  const sig = await hmac(secret, email);
  const token = btoa(email) + "." + sig;
  return `tadmur_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`;
}

export function clearSessionCookie() {
  return "tadmur_admin=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export async function getSessionEmail(request, env) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/tadmur_admin=([^;]+)/);
  if (!match) return null;
  const [b64, sig] = decodeURIComponent(match[1]).split(".");
  if (!b64 || !sig) return null;
  let email;
  try { email = atob(b64); } catch (e) { return null; }
  const secret = env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
  const expected = await hmac(secret, email);
  if (expected !== sig) return null;
  if (email !== (env.ADMIN_EMAIL || "")) return null;
  return email;
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

export async function requireAuth(request, env) {
  const email = await getSessionEmail(request, env);
  if (!email) return json({ error: "unauthorized" }, 401);
  return null; // null means OK to proceed
}
