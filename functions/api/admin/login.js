import { json, makeSessionCookie } from "../../_auth.js";

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }
  const { email, key } = body || {};
  const adminEmail = env.ADMIN_EMAIL || "";
  const adminKey = env.ADMIN_ACCESS_KEY || "";
  if (!email || !key || email.toLowerCase() !== adminEmail.toLowerCase() || key !== adminKey) {
    return json({ error: "invalid_credentials" }, 401);
  }
  const cookie = await makeSessionCookie(env, adminEmail);
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}
