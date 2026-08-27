import { json, requireAuth } from "../../_auth.js";
import { rowToProduct } from "../products.js";

export async function onRequestGet({ request, env }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  const { results } = await env.DB.prepare(
    "SELECT * FROM products ORDER BY sort_order ASC"
  ).all();
  return json(results.map(rowToProduct));
}

export async function onRequestPost({ request, env }) {
  const unauth = await requireAuth(request, env);
  if (unauth) return unauth;
  let p;
  try { p = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }
  if (!p.slug || !p.name) return json({ error: "slug_and_name_required" }, 400);

  const packs = Array.isArray(p.packs) && p.packs.length
    ? p.packs
    : [{ id: "p1", label: "Standard", price: p.price || 0, bonus: "" }];

  try {
    await env.DB.prepare(
      `INSERT INTO products
        (slug,name,tagline,price,compare,rating,reviews,sold,badge,category,category_slug,brand,region,delivery,image,packs_json,active,sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM products))`
    ).bind(
      p.slug, p.name, p.tagline || "", packs[0].price || p.price || 0, p.compare || null,
      p.rating || 5, p.reviews || 0, p.sold || 0, p.badge || null,
      p.category || "General", p.categorySlug || "general", p.brand || "", p.region || "Global",
      p.delivery || "instant", p.image || "/img/giftcards.png", JSON.stringify(packs),
      p.active === false ? 0 : 1
    ).run();
  } catch (e) {
    return json({ error: "insert_failed", detail: String(e) }, 400);
  }
  return json({ ok: true, slug: p.slug });
}
