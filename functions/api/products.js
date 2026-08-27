import { json } from "../_auth.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC"
  ).all();
  const products = results.map(rowToProduct);
  return json(products, 200, { "Cache-Control": "no-store" });
}

export function rowToProduct(r) {
  return {
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    price: r.price,
    compare: r.compare,
    rating: r.rating,
    reviews: r.reviews,
    sold: r.sold,
    badge: r.badge,
    category: r.category,
    categorySlug: r.category_slug,
    brand: r.brand,
    region: r.region,
    delivery: r.delivery,
    image: r.image,
    packs: JSON.parse(r.packs_json || "[]"),
    active: !!r.active,
  };
}
