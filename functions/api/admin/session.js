import { json, getSessionEmail } from "../../_auth.js";

export async function onRequestGet({ request, env }) {
  const email = await getSessionEmail(request, env);
  return json({ ok: !!email, email: email || null });
}
