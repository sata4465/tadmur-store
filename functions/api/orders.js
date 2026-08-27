import { json } from "../_auth.js";

// Public: create an order from checkout
export async function onRequestPost({ request, env }) {
  let o;
  try { o = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }
  if (!o.items || !o.items.length || !o.contact) {
    return json({ error: "items_and_contact_required" }, 400);
  }
  const id = "TDM-" + Date.now().toString(36).toUpperCase();
  const total = o.items.reduce((a, i) => a + i.price * i.qty, 0);

  await env.DB.prepare(
    `INSERT INTO orders (id, created_at, contact_json, items_json, total, currency, payment_method, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
  ).bind(
    id, new Date().toISOString(), JSON.stringify(o.contact), JSON.stringify(o.items),
    total, o.currency || "USD", o.paymentMethod || "unspecified"
  ).run();

  return json({ ok: true, orderId: id, total });
}
