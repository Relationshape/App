// Lightweight SVG charts: spider/radar (categories or items), bar diff,
// alignment heat strip. All renderers return SVG/HTML strings.
//
// Datasets are { name, color, answers, scale? }. If scale is omitted,
// the global default scale (Store.getScale()) is used.

import { CATEGORIES, SPIDER_AXES } from "./data.js";
import { Store } from "./storage.js";
import { t } from "./i18n.js";

function dsScale(ds) {
  return (ds && Array.isArray(ds.scale) && ds.scale.length >= 2)
    ? ds.scale
    : Store.getScale();
}
function scaleMaxValue(scale) {
  let m = -Infinity;
  for (const s of scale) if (s.value > m) m = s.value;
  return m;
}

// Push scale value(s) from an answer entry into values array.
// For gr categories (giving/receiving), both directions contribute independently.
function pushAnswerValues(entry, scale, byKey, values) {
  if (!entry) return;
  if (entry.giving !== undefined || entry.receiving !== undefined) {
    if (entry.giving && byKey(entry.giving)) values.push(byKey(entry.giving).value);
    if (entry.receiving && byKey(entry.receiving)) values.push(byKey(entry.receiving).value);
  } else if (entry.scale && byKey(entry.scale)) {
    values.push(byKey(entry.scale).value);
  }
}

export function categoryAverage(answers, catId, scale) {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return null;
  scale = scale || Store.getScale();
  const max = scaleMaxValue(scale);
  const byKey = (k) => scale.find(s => s.key === k);
  const values = [];
  const slot = answers?.[catId] || {};
  for (const item of cat.items) pushAnswerValues(slot[item], scale, byKey, values);
  for (const k of Object.keys(slot.__custom || {})) pushAnswerValues(slot.__custom[k], scale, byKey, values);
  if (!values.length) return null;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { value: avg, norm: max ? avg / max : 0 };
}

function answerScaleKey(entry) {
  if (!entry) return null;
  if (entry.giving !== undefined || entry.receiving !== undefined) {
    // For gr items: average giving + receiving; fall back to whichever is set
    return entry.giving || entry.receiving || null;
  }
  return entry.scale || null;
}

function answerAvgValue(entry, scale) {
  if (!entry) return null;
  if (entry.giving !== undefined || entry.receiving !== undefined) {
    const g = entry.giving ? scale.find(s => s.key === entry.giving) : null;
    const r = entry.receiving ? scale.find(s => s.key === entry.receiving) : null;
    if (!g && !r) return null;
    const avg = g && r ? (g.value + r.value) / 2 : (g || r).value;
    const max = scaleMaxValue(scale);
    const sc = g || r;
    return { value: avg, norm: max ? avg / max : 0, scaleEntry: sc, entry };
  }
  const sc = scale.find(s => s.key === entry.scale);
  if (!sc) return null;
  const max = scaleMaxValue(scale);
  return { value: sc.value, norm: max ? sc.value / max : 0, scaleEntry: sc, entry };
}

function itemNorm(answers, catId, item, isCustom, scale) {
  const slot = answers?.[catId];
  if (!slot) return null;
  const entry = isCustom ? slot.__custom?.[item] : slot[item];
  return answerAvgValue(entry, scale);
}

// Compute adaptive font size for axis labels based on number of axes.
// More axes → smaller font, capped at 18px, minimum 9px.
function labelFontSize(axisCount) {
  // At 6 axes: 16px; at 12: 12px; at 20+: 9px; max 18px (at ≤5 axes)
  const size = Math.round(Math.max(9, Math.min(18, 96 / axisCount)));
  return size;
}

// Generic radar chart. All point values are normalised (0..1).
function radar(axes, datasets, opts = {}) {
  const size = opts.size || 520;
  const cx = size / 2, cy = size / 2;
  const N = axes.length;
  if (!N) return `<div class="rs-empty">${t("spider_empty")}</div>`;

  // Adaptive padding based on font size and label length
  const fs = labelFontSize(N);
  const maxLabelLen = Math.max(...axes.map(a => (a.title || a.key).length));
  // More characters + larger font → need more padding for labels
  const labelPad = Math.min(110, Math.max(72, Math.ceil(maxLabelLen * fs * 0.38)));
  const pad = opts.pad || labelPad;
  const r = size / 2 - pad;

  const rings = [];
  const ringSteps = opts.ringSteps || 5;
  for (let g = 1; g <= ringSteps; g++) {
    const rr = (r * g) / ringSteps;
    const pts = axes.map((_, i) => angle(i, N, rr, cx, cy));
    rings.push(`<polygon class="rs-grid-ring" points="${pts.map(p => p.join(",")).join(" ")}"/>`);
  }
  let spokes = "";
  let labels = "";

  axes.forEach((ax, i) => {
    const [x, y] = angle(i, N, r, cx, cy);
    spokes += `<line class="rs-grid-spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;

    // Label position slightly further out than the ring
    const labelR = r + fs * 1.6;
    const [lx, ly] = angle(i, N, labelR, cx, cy);
    const anchor = Math.abs(lx - cx) < 4 ? "middle" : (lx > cx ? "start" : "end");

    const fullTitle = (ax.title || ax.key);
    // Truncate only if extremely long; dynamic font already handles compression
    const maxChars = Math.max(20, Math.round(120 / fs));
    const title = fullTitle.length > maxChars ? fullTitle.slice(0, maxChars - 1) + "…" : fullTitle;

    // Icon line slightly above label
    const iconOffset = ax.icon ? -(fs + 2) : 0;
    labels += `
      <g class="rs-axis-label" text-anchor="${anchor}" data-axis="${i}">
        ${ax.icon ? `<text x="${lx}" y="${ly + iconOffset}" class="rs-axis-icon" text-anchor="${anchor}" font-size="${fs + 2}">${ax.icon}</text>` : ""}
        <text x="${lx}" y="${ly + (ax.icon ? fs * 1.1 : fs * 0.4)}" class="rs-axis-text" font-size="${fs}" text-anchor="${anchor}"><title>${escape(fullTitle)}</title>${escape(title)}</text>
      </g>`;
  });

  let polys = "";
  let dots = "";
  datasets.forEach((ds, di) => {
    const pts = axes.map((_, i) => {
      const p = ds.points[i];
      const norm = p == null ? 0 : Math.max(0, Math.min(1, p.norm));
      return angle(i, N, r * norm, cx, cy);
    });
    const color = ds.color || `hsl(${(di*60)%360} 80% 60%)`;
    polys += `<polygon class="rs-poly" data-i="${di}" data-name="${escape(ds.name)}"
      points="${pts.map(p => p.join(",")).join(" ")}"
      style="fill:${color}; stroke:${color};"/>`;
    pts.forEach(([x, y], i) => {
      const p = ds.points[i];
      if (p == null) return;
      dots += `<circle cx="${x}" cy="${y}" r="4.5" class="rs-dot"
        data-i="${di}" data-axis="${escape(axes[i].title || axes[i].key)}"
        data-name="${escape(ds.name)}"
        data-label="${escape(p.label || "")}"
        data-color="${color}"
        style="fill:${color}; stroke:${color}"/>`;
    });
  });

  const legend = datasets.map((ds, i) => `
    <button type="button" class="rs-legend-chip" data-i="${i}" style="--c:${ds.color}" title="Click to toggle visibility">
      <span class="rs-legend-swatch"></span><span class="rs-legend-name">${escape(truncate(ds.name, 32))}</span>
    </button>`).join("");

  return `
    <div class="rs-chart-wrap" data-interactive="1">
      <svg viewBox="0 0 ${size} ${size}" class="rs-spider" role="img" aria-label="${opts.title || "Spider chart"}" preserveAspectRatio="xMidYMid meet">
        ${rings.join("")}
        ${spokes}
        ${polys}
        ${dots}
        ${labels}
      </svg>
      <div class="rs-legend">${legend}</div>
      <div class="rs-tooltip" aria-hidden="true"></div>
    </div>`;
}

export function bindSpiderInteractivity(root) {
  if (!root) return;
  root.querySelectorAll(".rs-chart-wrap[data-interactive]").forEach(wrap => {
    if (wrap.dataset.bound) return;
    wrap.dataset.bound = "1";
    const tip = wrap.querySelector(".rs-tooltip");
    const svg = wrap.querySelector("svg");
    const polys = Array.from(wrap.querySelectorAll(".rs-poly"));
    const dots = Array.from(wrap.querySelectorAll(".rs-dot"));
    const chips = Array.from(wrap.querySelectorAll(".rs-legend-chip"));

    function showTip(html, target) {
      tip.innerHTML = html;
      const wRect = wrap.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const x = tRect.left - wRect.left + tRect.width / 2;
      const y = tRect.top - wRect.top;
      tip.style.left = x + "px";
      tip.style.top = y + "px";
      tip.classList.add("show");
    }
    function hideTip() { tip.classList.remove("show"); }
    function setActive(i) {
      wrap.dataset.activeI = i == null ? "" : i;
      polys.forEach(p => {
        const pi = p.dataset.i;
        p.classList.toggle("is-active", String(i) === pi);
        p.classList.toggle("is-faded", i != null && String(i) !== pi);
      });
      dots.forEach(d => {
        const di = d.dataset.i;
        d.classList.toggle("is-faded", i != null && String(i) !== di);
      });
    }
    dots.forEach(d => {
      d.addEventListener("mouseenter", () => {
        const label = d.dataset.label || "";
        const html = `<strong>${d.dataset.name}</strong><br>${d.dataset.axis}${label ? `: <span style="color:${d.dataset.color}">${label}</span>` : ""}`;
        showTip(html, d);
        setActive(d.dataset.i);
      });
      d.addEventListener("mouseleave", () => { hideTip(); setActive(null); });
    });
    polys.forEach(p => {
      p.addEventListener("mouseenter", () => {
        showTip(`<strong>${p.dataset.name}</strong>`, p);
        setActive(p.dataset.i);
      });
      p.addEventListener("mouseleave", () => { hideTip(); setActive(null); });
    });
    chips.forEach(chip => {
      const i = chip.dataset.i;
      chip.addEventListener("click", () => {
        const off = chip.classList.toggle("off");
        polys.filter(p => p.dataset.i === i).forEach(p => p.classList.toggle("hidden", off));
        dots.filter(d => d.dataset.i === i).forEach(d => d.classList.toggle("hidden", off));
      });
      chip.addEventListener("mouseenter", () => setActive(i));
      chip.addEventListener("mouseleave", () => setActive(null));
    });
    svg.addEventListener("mouseleave", hideTip);
  });
}

// Spider chart over categories.
export function renderSpider(datasets, opts = {}) {
  const candidates = opts.axes || pickCategoryAxes(datasets);
  const axes = candidates.map(id => {
    const c = CATEGORIES.find(c => c.id === id);
    return { key: id, title: c?.title || id, icon: c?.icon || "•" };
  });
  const ds = datasets.map(d => {
    const scale = dsScale(d);
    return {
      name: d.name, color: d.color,
      points: axes.map(a => {
        const avg = categoryAverage(d.answers, a.key, scale);
        if (!avg) return null;
        const sc = closestScaleEntry(avg.value, scale);
        return { norm: avg.norm, label: sc?.label };
      }),
    };
  });
  return radar(axes, ds, { size: opts.size || 540, title: "Category overview", pad: opts.pad });
}

function pickCategoryAxes(datasets) {
  const filledIn = (id) => datasets.some(d => categoryAverage(d.answers, id, dsScale(d)) != null);
  const preferred = SPIDER_AXES.filter(filledIn);
  if (preferred.length >= 3) return preferred;
  const expanded = CATEGORIES.map(c => c.id).filter(filledIn);
  if (expanded.length >= 3) return expanded;
  return SPIDER_AXES;
}

export function renderItemSpider(datasets, catId, opts = {}) {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return "";

  const itemHas = (item, isCustom) =>
    datasets.some(d => itemNorm(d.answers, catId, item, isCustom, dsScale(d)) != null);
  const baseItems = cat.items.filter(item => itemHas(item, false));

  const customSet = new Set();
  datasets.forEach(d => {
    Object.keys(d.answers?.[catId]?.__custom || {}).forEach(k => customSet.add(k));
  });
  const customItems = Array.from(customSet).filter(k => itemHas(k, true));

  const axes = [
    ...baseItems.map(name => ({ key: name, title: name })),
    ...customItems.map(name => ({ key: "✶ " + name, title: "✶ " + name, _custom: true, _name: name })),
  ];
  if (axes.length < 3) {
    return `<div class="rs-empty">${t("item_spider_empty")}</div>`;
  }

  const ds = datasets.map(d => {
    const scale = dsScale(d);
    return {
      name: d.name, color: d.color,
      points: axes.map(a => {
        const v = itemNorm(d.answers, catId, a._custom ? a._name : a.key, !!a._custom, scale);
        if (!v) return null;
        return { norm: v.norm, label: v.scaleEntry.label };
      }),
    };
  });
  return radar(axes, ds, {
    size: opts.size || 480,
    title: `Spider chart for ${cat.title}`,
  });
}

export function renderCategoryBars(datasets, catId) {
  const cat = CATEGORIES.find(c => c.id === catId);
  if (!cat) return "";
  const itemSet = new Set(cat.items);
  for (const ds of datasets) {
    Object.keys(ds.answers?.[catId]?.__custom || {}).forEach(k => itemSet.add("✶ " + k));
  }
  const items = Array.from(itemSet);
  const rows = items.map(item => {
    const cells = datasets.map(ds => {
      const scale = dsScale(ds);
      const max = scaleMaxValue(scale);
      const isCustom = item.startsWith("✶ ");
      const key = isCustom ? item.slice(2) : item;
      const slot = isCustom
        ? ds.answers?.[catId]?.__custom?.[key]
        : ds.answers?.[catId]?.[key];
      const avg = slot ? answerAvgValue(slot, scale) : null;
      const sc = avg?.scaleEntry;
      const w = avg ? Math.round((avg.value / max) * 100) : 0;
      const color = sc ? sc.color : "transparent";
      const tip = sc ? `${ds.name}: ${sc.label}${slot.note ? " — "+slot.note : ""}` : `${ds.name}: —`;
      return `
        <div class="rs-bar-cell" title="${escape(tip)}">
          <span class="rs-bar-name">${escape(truncate(ds.name, 18))}</span>
          <span class="rs-bar">
            <span class="rs-bar-fill" style="width:${w}%; background:${color}"></span>
          </span>
          <span class="rs-bar-val">${sc ? escape(sc.short) : "—"}</span>
        </div>`;
    }).join("");
    return `<div class="rs-bar-row">
      <div class="rs-bar-label">${escape(item)}</div>
      <div class="rs-bar-cells">${cells}</div>
    </div>`;
  }).join("");

  return `<div class="rs-bars">${rows}</div>`;
}

export function renderAlignment(datasets) {
  if (datasets.length < 2) return "";
  const [a, b] = datasets;
  const sa = dsScale(a), sb = dsScale(b);
  const rows = CATEGORIES.map(cat => {
    const va = categoryAverage(a.answers, cat.id, sa);
    const vb = categoryAverage(b.answers, cat.id, sb);
    if (!va || !vb) return null;
    const diff = Math.abs(va.norm - vb.norm);
    const align = 1 - diff;
    return { cat, va, vb, diff, align };
  }).filter(Boolean).sort((x, y) => x.diff - y.diff);

  if (!rows.length) return `<div class="rs-empty">${t("spider_empty")}</div>`;
  const top = rows.slice(0, 5);
  const bottom = rows.slice(-5).reverse();
  const fmt = r => `
    <li>
      <span class="rs-align-pill" style="background:linear-gradient(90deg,#22c55e ${Math.round(r.align*100)}%,#ef4444 ${Math.round(r.align*100)}%)"></span>
      <span class="rs-align-icon">${r.cat.icon}</span>
      <span class="rs-align-title">${escape(r.cat.title)}</span>
      <span class="rs-align-meta">${Math.round(r.va.norm*100)}% ↔ ${Math.round(r.vb.norm*100)}%</span>
    </li>`;
  return `
    <div class="rs-align-grid">
      <section>
        <h3>${t("alignment_match")}</h3>
        <ul class="rs-align-list">${top.map(fmt).join("")}</ul>
      </section>
      <section>
        <h3>${t("alignment_gaps")}</h3>
        <ul class="rs-align-list">${bottom.map(fmt).join("")}</ul>
      </section>
    </div>`;
}

function closestScaleEntry(value, scale) {
  let best = scale[0], d = Infinity;
  for (const e of scale) {
    const dd = Math.abs(e.value - value);
    if (dd < d) { d = dd; best = e; }
  }
  return best;
}

function angle(i, n, radius, cx, cy) {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
  return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius];
}
function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
function truncate(s, n) { s = String(s ?? ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
