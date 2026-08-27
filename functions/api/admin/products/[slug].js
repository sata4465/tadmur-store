import { json, requireAuth } from "../../../_auth.js";

export async function onRequestPut({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  let p;
  try { p = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }
  const slug = params.slug;

  const existing = await env.DB.prepare("SELECT * FROM products WHERE slug = ?").bind(slug).first();
  if (!existing) return json({ error: "not_found" }, 404);

  const packs = Array.isArray(p.packs) && p.packs.length ? p.packs : JSON.parse(existing.packs_json || "[]");
  if (p.price !== undefined && !(Array.isArray(p.packs) && p.packs.length) && packs[0]) {
    packs[0] = { ...packs[0], price: Number(p.price) };
  }
  const price = packs[0] ? packs[0].price : (p.price ?? existing.price);

  await env.DB.prepare(
    `UPDATE products SET
      name = ?, tagline = ?, price = ?, compare = ?, badge = ?, category = ?, category_slug = ?,
      brand = ?, region = ?, delivery = ?, image = ?, packs_json = ?, active = ?
     WHERE slug = ?`
  ).bind(
    p.name ?? existing.name,
    p.tagline ?? existing.tagline,
    price,
    p.compare ?? existing.compare,
    p.badge ?? existing.badge,
    p.category ?? existing.category,
    p.categorySlug ?? existing.category_slug,
    p.brand ?? existing.brand,
    p.region ?? existing.region,
    p.delivery ?? existing.delivery,
    p.image ?? existing.image,
    JSON.stringify(packs),
    p.active === undefined ? existing.active : (p.active ? 1 : 0),
    slug
  ).run();

  return json({ ok: true });
}

export async function onRequestDelete({ request, env, params }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  await env.DB.prepare("DELETE FROM products WHERE slug = ?").bind(params.slug).run();
  return json({ ok: true });
}
