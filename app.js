(() => {
  const KEY = "palmyra.cart.v2";
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { cart = []; }
  const save = () => { localStorage.setItem(KEY, JSON.stringify(cart)); render(); };
  const find = (slug) => (window.TADMUR || []).find((p) => p.slug === slug);
  const money = (c) => "$" + (c / 100).toFixed(2).replace(/\.00$/, "");

  function render() {
    document.querySelectorAll("[data-count]").forEach((n) => (n.textContent = cart.reduce((a, b) => a + b.qty, 0)));
    const box = document.querySelector("[data-items]");
    if (box) box.innerHTML = cart.length
      ? cart.map((i) => '<div class="line"><img src="' + (i.image || "") + '" alt=""/><div style="flex:1"><b style="font-size:.9rem">' + i.name + "</b><div class='small'>" + i.label + " ×" + i.qty + "</div></div><b>" + money(i.price * i.qty) + "</b><button class='x' data-del='" + i.key + "'>✕</button></div>").join("")
      : "<p class='small'>Nothing yet — pick a pack and it stays saved on this device.</p>";
    const total = document.querySelector("[data-total]");
    if (total) total.textContent = money(cart.reduce((a, b) => a + b.price * b.qty, 0));
  }

  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-slug]");
    if (add) {
      const p = find(add.dataset.slug);
      if (!p) return;
      if (p.active === false) return;
      const packId = add.dataset.pack || (p.packs[0] && p.packs[0].id) || "p1";
      const pack = p.packs.find((x) => x.id === packId) || p.packs[0] || { id: "p1", label: "Standard", price: p.price };
      const box = document.querySelector("[data-qtyv]");
      const qty = add.closest(".buy") && box ? Number(box.textContent) || 1 : 1;
      const key = p.slug + ":" + pack.id;
      const hit = cart.find((i) => i.key === key);
      if (hit) hit.qty += qty; else cart.push({ key, slug: p.slug, name: p.name, label: pack.label, price: pack.price, qty, image: p.image });
      save();
      document.getElementById("cartDrawer")?.classList.add("on");
      return;
    }
    const del = e.target.closest("[data-del]");
    if (del) { cart = cart.filter((i) => i.key !== del.getAttribute("data-del")); save(); return; }
    const qty = e.target.closest("[data-qty]");
    if (qty) {
      const box = document.querySelector("[data-qtyv]");
      const next = Math.max(1, Math.min(20, (Number(box.textContent) || 1) + Number(qty.dataset.qty)));
      box.textContent = next;
      document.querySelectorAll("[data-live]").forEach((n) => {
        const checked = document.querySelector("input[name=pack]:checked");
        if (checked) n.textContent = money(Number(checked.dataset.price) * next);
      });
      return;
    }
    const open = e.target.closest("#cartToggle");
    if (open) return document.getElementById("cartDrawer").classList.add("on");
    if (e.target.closest("#cartClose") || e.target === document.body) document.getElementById("cartDrawer")?.classList.remove("on");
  });

  document.querySelectorAll("input[name=pack]").forEach((r) =>
    r.addEventListener("change", () => {
      const qty = Number(document.querySelector("[data-qtyv]")?.textContent || 1);
      document.querySelectorAll("[data-live]").forEach((n) => (n.textContent = money(Number(r.dataset.price) * qty)));
    }));

  const grid = document.getElementById("grid");
  const state = { q: "", cat: "", sort: "popular", max: "" };
  function applyGrid() {
    if (!grid) return;
    const list = (window.TADMUR || []).filter((p) =>
      p.active !== false &&
      (!state.q || (p.name + " " + (p.tagline || "") + " " + (p.brand || "")).toLowerCase().includes(state.q)) &&
      (!state.cat || p.category === state.cat) &&
      (!state.max || p.price <= Number(state.max)));
    list.sort((a, b) => state.sort === "price-asc" ? a.price - b.price : state.sort === "price-desc" ? b.price - a.price : state.sort === "rating" ? b.rating - a.rating : b.sold - a.sold);
    grid.innerHTML = list.map((p) => '<article class="card"><div class="thumb"><a href="/product/' + p.slug + '.html"><img src="' + (p.image || "") + '" alt="' + p.name + '"/></a>' + (p.badge ? '<span class="badge">' + p.badge + "</span>" : "") + '</div><div class="body"><p class="meta">' + (p.brand || p.category) + " · " + p.region + '</p><h3><a href="/product/' + p.slug + '.html">' + p.name + "</a></h3><p class='tag'>" + (p.tagline || "") + "</p><div class='row'><span class='price'>" + money(p.price) + (p.compare > p.price ? " <s>" + money(p.compare) + "</s>" : "") + "</span></div><div class='row'><span class='stars'>★ " + p.rating.toFixed(1) + "</span><button class='btn small add' data-slug='" + p.slug + "'>Add</button></div></div></article>").join("") || "<p class='small'>Nothing matches — widen the filters.</p>";
  }
  if (grid) {
    [["q", "input"], ["cat", "change"], ["sort", "change"], ["max", "change"]].forEach(([id, ev]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(ev, () => { state[id] = el.value.toLowerCase().trim(); applyGrid(); });
    });
  }

  // Sync a single product page's pack prices/labels + availability from live data
  function syncProductPage() {
    const buyBox = document.querySelector(".buy [data-slug]");
    if (!buyBox) return;
    const p = find(buyBox.dataset.slug);
    if (!p) return;
    const radios = document.querySelectorAll('input[name="pack"]');
    radios.forEach((r, idx) => {
      const pack = p.packs[idx];
      if (!pack) return;
      r.dataset.price = pack.price;
      const label = r.closest("label.pack");
      if (label) {
        const b = label.querySelector("span b");
        const i = label.querySelector("span i");
        const em = label.querySelector("em");
        if (b) b.textContent = pack.label;
        if (i) i.textContent = pack.bonus || pack.label;
        if (em) em.textContent = money(pack.price);
      }
    });
    const checked = document.querySelector('input[name="pack"]:checked') || radios[0];
    const qty = Number(document.querySelector("[data-qtyv]")?.textContent || 1);
    if (checked) document.querySelectorAll("[data-live]").forEach((n) => (n.textContent = money(Number(checked.dataset.price) * qty)));
    if (p.active === false) {
      buyBox.disabled = true;
      buyBox.textContent = "Currently unavailable";
    }
  }

  function refreshAll() {
    render();
    applyGrid();
    syncProductPage();
  }

  document.addEventListener("tadmur:ready", refreshAll);
  refreshAll();
})();
