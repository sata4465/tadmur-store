import { json, requireAuth } from "../../_auth.js";

export async function onRequestGet({ request, env }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const { results } = await env.DB.prepare(
    "SELECT * FROM orders ORDER BY created_at DESC LIMIT 200"
  ).all();
  const orders = results.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    contact: JSON.parse(r.contact_json || "{}"),
    items: JSON.parse(r.items_json || "[]"),
    total: r.total,
    currency: r.currency,
    paymentMethod: r.payment_method,
    status: r.status,
  }));
  return json(orders);
}

export async function onRequestPatch({ request, env }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }
  if (!body.id || !body.status) return json({ error: "id_and_status_required" }, 400);
  await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(body.status, body.id).run();
  return json({ ok: true });
}
