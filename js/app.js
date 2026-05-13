// Relationshape – App shell, router and view rendering.
// All state lives in localStorage via Store. No network calls.

import { CATEGORIES, DEFAULT_SCALE, SPIDER_AXES, CATEGORY_GROUPS } from "./data.js";
import { Store } from "./storage.js";
import { encryptResult, decryptResult } from "./crypto.js";
import {
  renderSpider, renderItemSpider, renderCategoryBars, renderAlignment,
  categoryAverage, bindSpiderInteractivity,
} from "./charts.js";
import { t, getLang, setLang, availableLangs } from "./i18n.js";

const $app = document.getElementById("app");
const $nav = document.getElementById("nav");

// ---------- tiny helpers ----------
const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(c));
  }
  return el;
};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const fmtDate = ts => new Date(ts).toLocaleDateString(undefined, { year:"numeric", month:"short", day:"numeric" });
function navigate(hash) { location.hash = hash; }
function getResultScale(result) { return Store.getResultScale(result); }

// ----- Theme -----
function applyTheme(t) {
  const theme = t || Store.getTheme() || "auto";
  document.documentElement.setAttribute("data-theme", theme);
  Store.setTheme(theme);
  const dark = theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = dark ? "#0f0c1a" : "#f7f5ff";
  document.head.append(meta);
}

// ----- Labels -----
function resultLabel(r, profile) {
  const v = r.version > 1 ? ` (v${r.version})` : "";
  const pName = profile?.name || (Store.getProfile(r.profileId)?.name) || "?";
  return `${pName} → ${r.subject}${v}`;
}
function importLabel(imp) {
  const v = imp.version > 1 ? ` (v${imp.version})` : "";
  return `${imp.name} → ${imp.subject}${v}`;
}

// ----- SVG Icon library — minimal stroke icons -----
const ICONS = {
  // Navigation (rendered at 13×13, viewBox 24×24)
  nav_profiles: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  nav_import:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m-4-4 4 4 4-4"/><line x1="3" y1="21" x2="21" y2="21"/></svg>`,
  nav_compare:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="12" r="6"/><circle cx="16" cy="12" r="6"/></svg>`,
  nav_settings: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
  nav_about:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,

  // Feature highlight cards (rendered at 26×26)
  feat_security: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" opacity="0.7"/></svg>`,
  feat_share:    `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><line x1="9" y1="18" x2="15" y2="18" opacity="0.5"/></svg>`,
  feat_charts:   `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><polygon points="12 6 18 9.5 18 14.5 12 18 6 14.5 6 9.5" stroke-opacity="0.55"/><polygon points="12 10 15 12 15 14 12 16 9 14 9 12" stroke-opacity="0.3"/></svg>`,
  feat_profiles: `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85" opacity="0.7"/></svg>`,

  // How-to step icons (rendered at 22×22)
  step_create:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="8" r="4"/><path d="M3 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/><path d="M19 4v6M16 7h6"/></svg>`,
  step_topics:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="7" height="7" rx="1"/><rect x="2" y="14" width="7" height="7" rx="1"/><line x1="13" y1="6.5" x2="22" y2="6.5"/><line x1="13" y1="11" x2="22" y2="11"/><line x1="13" y1="17.5" x2="22" y2="17.5"/></svg>`,
  step_answer:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="7" x2="21" y2="7"/><circle cx="8" cy="7" r="2.5" fill="currentColor" stroke="none" opacity="0.85"/><line x1="3" y1="13" x2="21" y2="13"/><circle cx="15" cy="13" r="2.5" fill="currentColor" stroke="none" opacity="0.85"/><line x1="3" y1="19" x2="21" y2="19"/><circle cx="10" cy="19" r="2.5" fill="currentColor" stroke="none" opacity="0.85"/></svg>`,
  step_map:     `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8 22 16 12 22 2 16 2 8"/><polygon points="12 6 18 9.5 18 14.5 12 18 6 14.5 6 9.5" stroke-opacity="0.5"/><line x1="12" y1="2" x2="12" y2="22" stroke-opacity="0.3"/></svg>`,
  step_share:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg>`,
};

// ----- Emoji picker -----
const EMOJI_BANK = [
  "🌷","🌹","🌻","🌼","🌸","🪻","🪷","🌺","🌿","🍀","🍃","🌱","🌳","🌲","🌴",
  "🦋","🐝","🐞","🐌","🐢","🦊","🐱","🐶","🐰","🐼","🦁","🐯","🐨","🦄","🐲",
  "🌊","🌙","☀️","⭐","✨","🌟","💫","☁️","🌈","🔥","❄️","⚡","🌍","🌌","🪐",
  "💞","💖","💗","💓","💘","💝","💜","💙","💚","🧡","💛","🤍","🖤","🤎",
  "🪩","🎨","🎭","🎵","🎶","🎷","🎸","🎺","🪕","📚","✏️","📷","🎬","🕯️",
  "☕","🍵","🍷","🍓","🍑","🍇","🥑","🍩","🧁","🍪","🥐","🌮","🍣","🍜",
  "⚓","🚲","🛵","🏔️","🏝️","🛶","🪁","🎢","🎡","♾️","🌀","🪄","🔮","🧿",
];

async function pickEmojiDialog(current = "✨") {
  let freeInput;
  return dialog({
    title: t("profile_emoji_label"),
    body: (close) => {
      freeInput = h("input", { type: "text", maxlength: 8, value: "", placeholder: "or type your own emoji…" });
      return h("div", { class: "emoji-picker" },
        h("div", { class: "emoji-grid" },
          ...EMOJI_BANK.map(e => h("button", {
            class: "emoji-cell" + (e === current ? " is-active" : ""),
            type: "button",
            onClick: () => close(e),
          }, e))),
        h("div", { class: "emoji-free" }, freeInput));
    },
    actions: [
      { label: t("btn_cancel"), kind: "ghost", value: null },
      { label: t("btn_ok"), kind: "primary", primary: true,
        handler: () => {
          const v = (freeInput?.value || "").trim();
          if (!v) return false;
          if (!isLikelyEmoji(v)) { dlgAlert("Please enter an emoji character (e.g. 🌷, 🍑, ✨)."); return false; }
          return v;
        } },
    ],
  });
}

function isLikelyEmoji(s) {
  if (!s) return false;
  try { return /\p{Extended_Pictographic}/u.test(s) && s.length <= 12; }
  catch { return /[^\x00-\x7F]/.test(s) && s.length <= 8; }
}

// ----- Scale slider component -----
function scaleSliderEl({ scale, valueKey, onChange, onClear, compact = false }) {
  const N = scale.length;
  const activeIdx = scale.findIndex(s => s.key === valueKey);
  const hasValue = activeIdx >= 0;

  const root = h("div", {
    class: "rs-slider" + (hasValue ? " has-value" : " no-value") + (compact ? " is-compact" : ""),
    role: "slider",
    "aria-valuemin": "1", "aria-valuemax": String(N),
    "aria-valuenow": hasValue ? String(activeIdx + 1) : null,
    "aria-valuetext": hasValue ? scale[activeIdx].label : "not set",
    tabindex: "0",
  });
  const trackGrad = scale.map((s, i) => `${s.color} ${(i/(N-1))*100}%`).join(", ");
  const trackGradWrap = h("div", { class: "rs-slider-track-wrap" });
  const trackBg = h("div", { class: "rs-slider-track-bg" });
  const trackActive = h("div", { class: "rs-slider-track-active", style: `background: linear-gradient(90deg, ${trackGrad});` });
  trackGradWrap.append(trackBg, trackActive);

  const ticks = scale.map((s, i) => {
    const left = N === 1 ? 50 : (i / (N - 1)) * 100;
    const tick = h("button", {
      class: "rs-slider-tick" + (i === activeIdx ? " is-active" : ""),
      style: `--c:${s.color}; left:${left}%`,
      type: "button",
      "aria-label": `${i + 1}: ${s.label}`,
      title: s.description || s.label,
      onClick: e => { e.stopPropagation(); applyIndex(i); },
    },
      h("span", { class: "rs-slider-dot" }),
      h("span", { class: "rs-slider-tick-label" }, s.short || s.label),
    );
    return tick;
  });

  trackGradWrap.append(...ticks);
  root.append(trackGradWrap);

  if (hasValue) {
    const clear = h("button", {
      class: "rs-slider-clear", type: "button",
      title: t("q_slider_reset"),
      onClick: e => { e.stopPropagation(); onClear && onClear(); },
    }, t("q_slider_reset"));
    root.append(clear);
  }

  let dragging = false;
  function indexFromX(clientX) {
    const rect = trackGradWrap.getBoundingClientRect();
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(ratio * (N - 1));
  }
  function applyIndex(i) {
    if (i < 0 || i >= N) return;
    onChange && onChange(scale[i].key, i);
  }
  trackGradWrap.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".rs-slider-tick") || e.target.closest(".rs-slider-clear")) return;
    dragging = true;
    trackGradWrap.setPointerCapture(e.pointerId);
    applyIndex(indexFromX(e.clientX));
  });
  trackGradWrap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    applyIndex(indexFromX(e.clientX));
  });
  trackGradWrap.addEventListener("pointerup", () => { dragging = false; });
  trackGradWrap.addEventListener("pointercancel", () => { dragging = false; });

  root.addEventListener("keydown", (e) => {
    if (e.target !== root) return;
    let idx = hasValue ? activeIdx : Math.floor(N / 2);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); applyIndex(idx + 1); }
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); applyIndex(idx - 1); }
    else if (e.key === "Home") { e.preventDefault(); applyIndex(0); }
    else if (e.key === "End")  { e.preventDefault(); applyIndex(N - 1); }
    else if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); onClear?.(); }
    else if (e.key >= "1" && e.key <= "9") {
      const k = parseInt(e.key, 10) - 1;
      if (k < N) { e.preventDefault(); applyIndex(k); }
    }
  });

  return root;
}

// ----- Asked-items helper -----
function isCategoryEnabled(result, catId) {
  if (!result.enabledCategories) return true;
  return result.enabledCategories.includes(catId);
}
function askedItemsForCat(result, catId) {
  if (result.askedItems && result.askedItems[catId]) {
    return {
      base: result.askedItems[catId].base || [],
      custom: result.askedItems[catId].custom || [],
    };
  }
  return null;
}
function enabledCategoryList(result) {
  return CATEGORIES.filter(c => isCategoryEnabled(result, c.id));
}

function getItemLabel(cat, itemKey, lang) {
  if (lang === "de" && cat.deItems) {
    const idx = cat.items.indexOf(itemKey);
    if (idx >= 0 && cat.deItems[idx]) return cat.deItems[idx];
  }
  return itemKey;
}

function getCatTitle(cat, lang) {
  return lang === "de" && cat.de ? cat.de : cat.title;
}

// ---------- Modal / dialog ----------
function dialog({ title, body, fields = [], actions, dismissable = true }) {
  return new Promise(resolve => {
    const overlay = h("div", { class: "rs-modal-overlay", role: "dialog", "aria-modal": "true" });
    const card = h("div", { class: "rs-modal-card" });
    const close = (val) => {
      overlay.classList.add("closing");
      setTimeout(() => overlay.remove(), 160);
      resolve(val);
      document.removeEventListener("keydown", esckey);
    };
    const esckey = (e) => {
      if (e.key === "Escape" && dismissable) close(null);
      else if (e.key === "Enter" && document.activeElement?.tagName !== "TEXTAREA") {
        const primary = card.querySelector(".rs-modal-actions .btn-primary");
        if (primary) { e.preventDefault(); primary.click(); }
      }
    };
    document.addEventListener("keydown", esckey);
    overlay.addEventListener("click", e => { if (e.target === overlay && dismissable) close(null); });

    if (title) card.append(h("h2", { class: "rs-modal-title" }, title));
    if (body) {
      let b;
      if (typeof body === "string") b = h("div", { class: "rs-modal-body", html: body });
      else if (typeof body === "function") b = h("div", { class: "rs-modal-body" }, body((val) => close(val)));
      else b = h("div", { class: "rs-modal-body" }, body);
      card.append(b);
    }

    const inputs = {};
    if (fields.length) {
      const form = h("div", { class: "rs-modal-fields" });
      fields.forEach((f, i) => {
        const id = `rs-field-${i}`;
        const label = h("label", { for: id }, f.label);
        let input;
        if (f.type === "textarea") {
          input = h("textarea", {
            id, name: f.name, rows: f.rows || 6,
            placeholder: f.placeholder || "",
          }, f.value || "");
        } else if (f.type === "select") {
          input = h("select", { id, name: f.name },
            ...(f.options || []).map(o => h("option", { value: o.value, selected: o.value === f.value }, o.label)));
        } else {
          input = h("input", {
            id, name: f.name,
            type: f.type || "text",
            value: f.value ?? "",
            placeholder: f.placeholder || "",
            autocomplete: f.autocomplete || "off",
            minlength: f.minlength,
            maxlength: f.maxlength,
            required: f.required,
          });
        }
        if (f.autofocus) setTimeout(() => input.focus(), 0);
        inputs[f.name] = input;
        form.append(h("div", { class: "rs-field" }, label, input));
      });
      card.append(form);
    }

    const acts = actions || [
      { label: t("btn_cancel"), value: null, kind: "ghost" },
      { label: t("btn_ok"), value: true, kind: "primary", primary: true },
    ];
    const actionRow = h("div", { class: "rs-modal-actions" });
    acts.forEach(a => {
      actionRow.append(h("button", {
        class: "btn " + (a.kind === "primary" ? "btn-primary" : a.kind === "danger" ? "btn-danger" : "btn-ghost"),
        onClick: async () => {
          if (a.handler) {
            try {
              const out = await a.handler(values());
              if (out !== false) close(out === undefined ? a.value : out);
            } catch (err) {
              showToast(err.message || "Error");
            }
          } else {
            close(a.value === undefined ? values() : a.value);
          }
        },
      }, a.label));
    });
    card.append(actionRow);

    function values() {
      const v = {};
      for (const k of Object.keys(inputs)) v[k] = inputs[k].value;
      return v;
    }

    overlay.append(card);
    document.body.append(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));
  });
}

async function dlgAlert(message, title = "") {
  return dialog({
    title: title || undefined,
    body: h("p", {}, message),
    actions: [{ label: t("btn_ok"), kind: "primary", value: true, primary: true }],
  });
}
async function dlgConfirm(message, { okLabel = "", danger = false } = {}) {
  return dialog({
    body: h("p", {}, message),
    actions: [
      { label: t("btn_cancel"), kind: "ghost", value: false },
      { label: okLabel || t("btn_ok"), kind: danger ? "danger" : "primary", value: true, primary: true },
    ],
  });
}
async function dlgPrompt({ title, label, placeholder = "", value = "", multiline = false, okLabel = "" } = {}) {
  const result = await dialog({
    title,
    fields: [{
      name: "v", label: label || title, value, placeholder,
      type: multiline ? "textarea" : "text", autofocus: true, required: true,
    }],
    actions: [
      { label: t("btn_cancel"), kind: "ghost", value: null },
      { label: okLabel || t("btn_save"), kind: "primary", primary: true,
        handler: vals => (vals.v?.trim() ? vals.v.trim() : false) },
    ],
  });
  return result === null ? null : result;
}

let toastT;
function showToast(msg) {
  let toastEl = document.querySelector(".toast");
  if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "toast"; document.body.append(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => toastEl.classList.remove("show"), 1900);
}

// ---------- Wizard helpers ----------
function demoSpiderSVG() {
  const CX = 95, CY = 95, R = 68, N = 6;
  const a0 = -Math.PI / 2;
  const step = (2 * Math.PI) / N;
  const pt = (f, i) => [CX + f * R * Math.cos(a0 + i * step), CY + f * R * Math.sin(a0 + i * step)];
  const polyStr = (vals) => vals.map((f, i) => { const [x, y] = pt(f, i); return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ");
  const axisLines = Array.from({ length: N }, (_, i) => {
    const [x, y] = pt(1, i);
    return `<line x1="${CX}" y1="${CY}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1" opacity=".5"/>`;
  }).join("");
  const ringStr = (f) => polyStr(Array(N).fill(f));
  const va = [0.85, 0.6, 0.78, 0.5, 0.92, 0.65];
  const vb = [0.5, 0.88, 0.55, 0.85, 0.62, 0.9];
  return `<svg viewBox="0 0 190 190" width="172" height="172" xmlns="http://www.w3.org/2000/svg">
    ${axisLines}
    <polygon points="${ringStr(1)}" fill="none" stroke="var(--line)" stroke-width="1" opacity=".45"/>
    <polygon points="${ringStr(0.66)}" fill="none" stroke="var(--line)" stroke-width="1" opacity=".3" stroke-dasharray="3,3"/>
    <polygon points="${ringStr(0.33)}" fill="none" stroke="var(--line)" stroke-width="1" opacity=".2" stroke-dasharray="2,4"/>
    <polygon points="${polyStr(va)}" style="fill:color-mix(in oklab,var(--primary) 22%,transparent);stroke:var(--primary);" stroke-width="2" stroke-linejoin="round" fill-opacity="1"/>
    <polygon points="${polyStr(vb)}" style="fill:color-mix(in oklab,var(--accent) 22%,transparent);stroke:var(--accent);" stroke-width="2" stroke-linejoin="round" fill-opacity="1"/>
    ${va.map((f, i) => { const [x, y] = pt(f, i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" style="fill:var(--primary);stroke:var(--bg);" stroke-width="1.5"/>`; }).join("")}
    ${vb.map((f, i) => { const [x, y] = pt(f, i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" style="fill:var(--accent);stroke:var(--bg);" stroke-width="1.5"/>`; }).join("")}
  </svg>`;
}

function heroConstellationSVG() {
  const W = 840, H = 340;

  const nodes = [
    // Far layer — large soft orbs, slow pulse (varied sizes for visual interest)
    { x: 118, y: 50,  r: 9.5, d: 0, acc: false },
    { x: 292, y: 24,  r: 7,   d: 0, acc: false },
    { x: 562, y: 35,  r: 11,  d: 0, acc: false },
    { x: 718, y: 60,  r: 8,   d: 0, acc: false },
    { x: 18,  y: 142, r: 7.5, d: 0, acc: false },
    { x: 820, y: 120, r: 8.5, d: 0, acc: false },
    { x: 30,  y: 225, r: 6.5, d: 0, acc: false },
    { x: 808, y: 200, r: 7.5, d: 0, acc: false },
    { x: 152, y: 282, r: 12,  d: 0, acc: false },
    { x: 362, y: 308, r: 8,   d: 0, acc: false },
    { x: 505, y: 318, r: 6.5, d: 0, acc: false },
    { x: 682, y: 278, r: 10,  d: 0, acc: false },
    { x: 835, y: 258, r: 7,   d: 0, acc: false },
    // Mid layer — accent highlights, medium brightness
    { x: 195, y: 148, r: 6,   d: 1, acc: true  },
    { x: 445, y: 100, r: 5,   d: 1, acc: false },
    { x: 638, y: 162, r: 7,   d: 1, acc: true  },
    { x: 275, y: 228, r: 5.5, d: 1, acc: false },
    { x: 590, y: 242, r: 6.5, d: 1, acc: true  },
    { x: 755, y: 178, r: 5.5, d: 1, acc: false },
    // Near layer — small, sharp, bright, fast
    { x: 388, y: 168, r: 4,   d: 2, acc: true  },
    { x: 518, y: 198, r: 3.2, d: 2, acc: false },
    { x: 320, y: 278, r: 3.6, d: 2, acc: true  },
    { x: 210, y: 200, r: 2.8, d: 2, acc: false },
  ];

  const mainEdges  = [[0,1],[1,2],[2,3],[0,4],[3,5],[4,6],[5,7],[6,8],[7,12],[8,9],[9,10],[10,11],[11,12],[1,9],[2,11]];
  const crossEdges = [[13,0],[13,14],[14,2],[15,3],[15,18],[16,8],[17,9],[18,11],[13,16],[17,20],[19,14],[16,21],[22,9],[22,16]];

  // Micro-stars for starfield depth
  const starData = [
    [42,18,0.6],[160,38,0.8],[380,15,0.5],[550,22,0.7],[720,40,0.6],[800,55,0.9],
    [60,90,0.5],[200,75,0.7],[330,55,0.6],[480,80,0.8],[640,60,0.5],[770,90,0.7],
    [85,150,0.6],[245,135,0.5],[450,130,0.7],[700,140,0.6],[140,190,0.5],[490,155,0.8],
    [720,190,0.6],[350,240,0.7],[570,260,0.5],[715,245,0.6],[100,260,0.7],
    [475,290,0.5],[640,320,0.6],[200,310,0.7],[700,330,0.5],[820,300,0.6],
  ];
  const stars = starData.map(([x,y,r], i) => {
    const op = (0.10 + (i % 6) * 0.05).toFixed(2);
    const col = i % 4 === 0 ? "var(--accent)" : "var(--primary)";
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="${op}"/>`;
  }).join("");

  // Per-node gradient defs — sphere gradient + iridescent shimmer
  const iridGrads = `
    <linearGradient id="ir0" gradientUnits="objectBoundingBox" x1="1" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#c084fc"/><stop offset="16%"  stop-color="#818cf8"/>
      <stop offset="32%"  stop-color="#38bdf8"/><stop offset="48%"  stop-color="#2dd4bf"/>
      <stop offset="64%"  stop-color="#f472b6"/><stop offset="82%"  stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#c084fc"/>
      <animateTransform attributeName="gradientTransform" type="rotate"
        values="0 0.5 0.5;360 0.5 0.5" dur="7s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="ir1" gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#f472b6"/><stop offset="20%"  stop-color="#c084fc"/>
      <stop offset="40%"  stop-color="#60a5fa"/><stop offset="60%"  stop-color="#34d399"/>
      <stop offset="80%"  stop-color="#fbbf24"/><stop offset="100%" stop-color="#f472b6"/>
      <animateTransform attributeName="gradientTransform" type="rotate"
        values="0 0.5 0.5;-360 0.5 0.5" dur="10s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="ir2" gradientUnits="objectBoundingBox" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%"   stop-color="#38bdf8"/><stop offset="25%"  stop-color="#d946ef"/>
      <stop offset="50%"  stop-color="#f9a8d4"/><stop offset="75%"  stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#38bdf8"/>
      <animateTransform attributeName="gradientTransform" type="rotate"
        values="0 0.5 0.5;360 0.5 0.5" dur="5s" repeatCount="indefinite"/>
    </linearGradient>`;

  const sphereDefs = nodes.map(({ d, acc }, i) => {
    const col  = acc ? "var(--accent)" : "var(--primary)";
    const col2 = acc ? "var(--primary)" : "var(--accent)";
    // Vary highlight position per node for naturalistic look (30–48%, 22–38%)
    const hx = 30 + (i * 11) % 18;
    const hy = 22 + (i * 7)  % 16;
    // Opacity by depth
    const specOp     = [0.22, 0.48, 0.78][d].toFixed(2);
    const bodyHigh   = [0.78, 0.90, 1.00][d].toFixed(2);
    const bodyMid    = [0.50, 0.62, 0.75][d].toFixed(2);
    const bodyLow    = [0.08, 0.14, 0.22][d].toFixed(2);
    const iridOp     = [0.08, 0.18, 0.30][d].toFixed(2);
    return `<radialGradient id="sg${i}" cx="${hx}%" cy="${hy}%" r="72%" fx="${hx-8}%" fy="${hy-8}%">
        <stop offset="0%"   stop-color="white"  stop-opacity="${specOp}"/>
        <stop offset="18%"  stop-color="${col}"  stop-opacity="${bodyHigh}"/>
        <stop offset="68%"  stop-color="${col}"  stop-opacity="${bodyMid}"/>
        <stop offset="100%" stop-color="${col}"  stop-opacity="${bodyLow}"/>
      </radialGradient>
      <radialGradient id="hg${i}" cx="72%" cy="72%" r="50%">
        <stop offset="0%"   stop-color="${col2}" stop-opacity="${iridOp}"/>
        <stop offset="100%" stop-color="${col2}" stop-opacity="0"/>
      </radialGradient>`;
  }).join("");

  const renderEdge = (a, b) => {
    const na = nodes[a], nb = nodes[b];
    if (!na || !nb) return "";
    const dist = Math.hypot(nb.x - na.x, nb.y - na.y);
    const depthAvg = (na.d + nb.d) / 2;
    const baseOp   = [0.20, 0.32, 0.48][Math.round(depthAvg)] ?? 0.20;
    const op = Math.max(0.05, baseOp - dist * 0.000055).toFixed(2);
    const w  = (0.6 + depthAvg * 0.5).toFixed(1);
    const col = (na.acc || nb.acc) ? "var(--accent)" : "var(--primary)";
    return `<line x1="${na.x.toFixed(1)}" y1="${na.y.toFixed(1)}" x2="${nb.x.toFixed(1)}" y2="${nb.y.toFixed(1)}" stroke="${col}" stroke-opacity="${op}" stroke-width="${w}"/>`;
  };
  const lines = [...mainEdges, ...crossEdges].map(([a,b]) => renderEdge(a,b)).join("");

  const renderNode = ({ x, y, r, d, acc }, i) => {
    const speed = [4.5, 3.2, 2.2][d];
    const da = (speed + (i * 0.23) % 1.5).toFixed(1);
    const db = (speed * 1.45 + (i * 0.37) % 1.8).toFixed(1);
    const dc = (speed * 0.78 + (i * 0.29) % 1.1).toFixed(1);
    const d1 = (speed * 0.88 + (i * 0.15) % 0.8).toFixed(1);

    const swA = [0.8, 1.1, 1.6][d].toFixed(1);
    const swB = [0.6, 0.85, 1.2][d].toFixed(1);
    const swC = [0.45, 0.65, 0.95][d].toFixed(1);

    // Start right at sphere surface, expand outward while fading
    const rA_s = (r * 1.02).toFixed(1);
    const rA_e = (r * [5.8, 4.6, 3.5][d]).toFixed(1);
    const rB_s = (r * 1.02).toFixed(1);
    const rB_e = (r * [4.5, 3.6, 2.8][d]).toFixed(1);
    const rC_s = (r * 1.02).toFixed(1);
    const rC_e = (r * [3.2, 2.5, 2.0][d]).toFixed(1);

    const opA = [0.45, 0.65, 0.85][d];
    const opB = [0.35, 0.52, 0.70][d];
    const opC = [0.28, 0.42, 0.60][d];
    const filmOp = [0.04, 0.06, 0.09][d];

    // rx and ry morph in opposite directions — wobbly organic bubble shape
    const mA = 1.18, mB = 1.24, mC = 1.15;

    // Cycle gradient per node for visual variety across the constellation
    const gA = `ir${i % 3}`;
    const gB = `ir${(i + 1) % 3}`;
    const gC = `ir${(i + 2) % 3}`;

    // Smooth expand+fade, invisible reset (opacity=0 during snap-back)
    const kt = "0;0.62;0.90;1";
    const ks = "0.42 0 0.58 1;0 0 1 1;0 0 1 1";
    const rimOp = [0.00, 0.14, 0.28][d];

    return `<g>
      <ellipse cx="${x}" cy="${y}" rx="${rA_s}" ry="${(parseFloat(rA_s)*mA).toFixed(1)}"
        fill="url(#${gA})" fill-opacity="${filmOp}" stroke="url(#${gA})" stroke-width="${swA}">
        <animate attributeName="rx" values="${rA_s};${rA_e};${rA_e};${rA_s}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${da}s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="${(parseFloat(rA_s)*mA).toFixed(1)};${(parseFloat(rA_e)/mA).toFixed(1)};${(parseFloat(rA_e)/mA).toFixed(1)};${(parseFloat(rA_s)*mA).toFixed(1)}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${da}s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="${opA};0;0;${opA}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${da}s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" values="${filmOp};0;0;${filmOp}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${da}s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="${x}" cy="${y}" rx="${rB_s}" ry="${(parseFloat(rB_s)/mB).toFixed(1)}"
        fill="none" stroke="url(#${gB})" stroke-width="${swB}">
        <animate attributeName="rx" values="${rB_s};${rB_e};${rB_e};${rB_s}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${db}s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="${(parseFloat(rB_s)/mB).toFixed(1)};${(parseFloat(rB_e)*mB).toFixed(1)};${(parseFloat(rB_e)*mB).toFixed(1)};${(parseFloat(rB_s)/mB).toFixed(1)}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${db}s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="${opB};0;0;${opB}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${db}s" repeatCount="indefinite"/>
      </ellipse>
      <ellipse cx="${x}" cy="${y}" rx="${rC_s}" ry="${(parseFloat(rC_s)*mC).toFixed(1)}"
        fill="none" stroke="url(#${gC})" stroke-width="${swC}">
        <animate attributeName="rx" values="${rC_s};${rC_e};${rC_e};${rC_s}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${dc}s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="${(parseFloat(rC_s)*mC).toFixed(1)};${(parseFloat(rC_e)/mC).toFixed(1)};${(parseFloat(rC_e)/mC).toFixed(1)};${(parseFloat(rC_s)*mC).toFixed(1)}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${dc}s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="${opC};0;0;${opC}" keyTimes="${kt}" calcMode="spline" keySplines="${ks}" dur="${dc}s" repeatCount="indefinite"/>
      </ellipse>
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#sg${i})">
        <animate attributeName="opacity" values="1;0.85;1" dur="${d1}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${x}" cy="${y}" r="${r}" fill="url(#hg${i})">
        <animate attributeName="opacity" values="1;0.45;1" dur="${da}s" repeatCount="indefinite"/>
      </circle>
      ${rimOp > 0 ? `<circle cx="${x}" cy="${y}" r="${(r-0.3).toFixed(1)}" fill="none" stroke="white" stroke-width="0.55" stroke-opacity="${rimOp.toFixed(2)}"/>` : ""}
    </g>`;
  };
  const pts = nodes.map((n, i) => renderNode(n, i)).join("");

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>${iridGrads}${sphereDefs}</defs>${stars}${lines}${pts}</svg>`;
}

function buildWizardSteps() {
  return [
    { title: t("wizard_s1_title"), body: t("wizard_s1_body"), emoji: "🌷" },
    { title: t("wizard_s2_title"), body: t("wizard_s2_body"), emoji: "🔒" },
    { title: t("wizard_s3_title"), body: t("wizard_s3_body"), emoji: "👤" },
    { title: t("wizard_s4_title"), body: t("wizard_s4_body"), emoji: "🗺️" },
    { title: t("wizard_s5_title"), body: t("wizard_s5_body"), emoji: "📤" },
    { title: t("wizard_s6_title"), body: t("wizard_s6_body"), visual: demoSpiderSVG() },
    { title: t("wizard_s7_title"), body: t("wizard_s7_body"), emoji: "⚙️" },
  ];
}

function runWizard(steps) {
  return new Promise(resolve => {
    let idx = 0;
    let touchStartX = 0;

    const overlay = h("div", { class: "rs-modal-overlay wizard-overlay", role: "dialog", "aria-modal": "true" });
    const card = h("div", { class: "rs-modal-card wizard-card" });

    const close = () => {
      overlay.classList.add("closing");
      setTimeout(() => overlay.remove(), 180);
      resolve();
    };

    // Touch/swipe support
    card.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    card.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0 && idx < steps.length - 1) { idx++; render(); }
      else if (dx > 0 && idx > 0) { idx--; render(); }
    }, { passive: true });

    function render() {
      const step = steps[idx];
      const isLast = idx === steps.length - 1;
      card.innerHTML = "";

      const header = h("div", { class: "wizard-header" },
        h("div", { class: "wizard-dots" },
          ...steps.map((_, i) => h("span", { class: "wizard-dot" + (i === idx ? " active" : "") }))
        ),
        h("button", { class: "wizard-close-btn", title: t("btn_close"), onClick: close }, "✕"),
      );

      const visual = step.visual
        ? h("div", { class: "wizard-visual", html: step.visual })
        : h("div", { class: "wizard-emoji" }, step.emoji);

      const content = h("div", { class: "wizard-content" },
        visual,
        h("h2", { class: "wizard-title" }, step.title),
        h("p", { class: "wizard-body" }, step.body),
      );

      const actions = h("div", { class: "wizard-actions" },
        idx > 0
          ? h("button", { class: "btn btn-ghost", onClick: () => { idx--; render(); } }, t("wizard_prev"))
          : h("span", {}),
        isLast
          ? h("button", { class: "btn btn-primary", onClick: close }, t("wizard_finish"))
          : h("button", { class: "btn btn-primary", onClick: () => { idx++; render(); } }, t("wizard_next")),
      );

      const skipRow = h("div", { class: "wizard-skip-row" },
        h("button", { class: "wizard-skip-link", onClick: close }, t("wizard_skip")),
      );

      card.append(header, content, actions, skipRow);
    }

    render();
    overlay.append(card);
    document.body.append(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));
  });
}

// ---------- Age Gate ----------
async function checkAgeGate() {
  if (localStorage.getItem("rs-age-confirmed")) return;
  const confirmed = await dialog({
    title: t("age_gate_title"),
    body: () => h("p", { class: "muted" }, t("age_gate_body")),
    actions: [
      { label: t("age_gate_no"), kind: "ghost", value: false },
      { label: t("age_gate_yes"), kind: "primary", primary: true, value: true },
    ],
    dismissable: false,
  }).catch(() => false);
  if (confirmed) {
    localStorage.setItem("rs-age-confirmed", "1");
  } else {
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;padding:2rem;font-family:sans-serif"><p style="max-width:360px;color:#666">${t("age_gate_body")}</p></div>`;
  }
}

// ---------- Onboarding Wizard ----------
async function showWizardIfFirstVisit() {
  if (!Store.isFirstVisit()) return;
  Store.markWizardSeen();
  return runWizard(buildWizardSteps());
}

// ---------- router ----------
window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => applyTheme());
  bindGlobalNav();
  route();
  await checkAgeGate();
  // Show wizard on first ever visit (only on home page)
  const hash = location.hash.replace(/^#\/?/, "");
  const seg = hash.split("?")[0].split("/")[0];
  if (!seg) await showWizardIfFirstVisit();
});

function route() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [path, queryStr] = hash.split("?");
  const segs = path.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryStr || ""));

  $app.innerHTML = "";

  switch (segs[0]) {
    case undefined:
    case "":         viewHome(); break;
    case "welcome":  $app.append(viewWelcome()); break;
    case "profile":
      if (segs[1] === "new") viewProfileEdit(null);
      else if (segs[2] === "edit") viewProfileEdit(segs[1]);
      else viewProfile(segs[1]);
      break;
    case "q":        viewQuestionnaire(segs[1], segs[2]); break;
    case "result":   viewResult(segs[1]); break;
    case "share":    viewShare(segs[1]); break;
    case "import":   viewImport(); break;
    case "compare":  viewCompare(query.ids ? query.ids.split(",") : []); break;
    case "settings": viewSettings(); break;
    case "map":
      if (segs[2] === "settings") viewMapSettings(segs[1]);
      else navigate(`/result/${segs[1]}`);
      break;
    case "intro":
    case "about":    viewIntro(); break;
    case "q-categories": viewCategoryOverview(segs[1], segs[2]); break;
    default:         viewHome();
  }
  document.querySelectorAll("#nav a:not(.nav-brand)").forEach(a => {
    const href = a.getAttribute("href");
    const seg = segs[0] || "";
    a.classList.toggle("active", href === "#/" + seg || (href === "#/" && seg === ""));
  });
  bindSpiderInteractivity($app);
  window.scrollTo(0, 0);
}

function buildLangPicker() {
  const wrap = h("div", { class: "nav-lang" });
  const currentLang = getLang();
  const langs = availableLangs();
  const currentLabel = langs.find(l => l.code === currentLang)?.code.toUpperCase() || "EN";

  const btn = h("button", { class: "nav-lang-btn", type: "button", "aria-label": "Language" },
    currentLabel,
    h("span", { class: "lang-arrow" }, "▾"),
  );

  const dropdown = h("div", { class: "nav-lang-dropdown" },
    ...langs.map(lang => h("button", {
      class: "nav-lang-option" + (currentLang === lang.code ? " active" : ""),
      type: "button",
      onClick: () => {
        setLang(lang.code);
        wrap.classList.remove("open");
        bindGlobalNav();
        route();
      },
    }, lang.label, h("span", { class: "lang-check" }, "✓")))
  );

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    wrap.classList.toggle("open");
  });

  document.addEventListener("click", () => wrap.classList.remove("open"), { capture: false });

  wrap.append(btn, dropdown);
  return wrap;
}

function stripLeadingEmoji(s) {
  try { return s.replace(/^[\p{Extended_Pictographic}\s]+/u, "").trim(); }
  catch { return s.replace(/^[^\x00-\x7F\s]+\s*/, "").trim(); }
}

function navLink(href, icon, label) {
  const cleanLabel = stripLeadingEmoji(label);
  return h("a", { href, title: cleanLabel },
    h("span", { class: "nav-icon", html: icon }),
    h("span", { class: "nav-link-label" }, cleanLabel),
  );
}

function bindGlobalNav() {
  $nav.innerHTML = "";
  $nav.classList.remove("nav-open");

  const navLinks = h("div", { class: "nav-links" },
    navLink("#/",         ICONS.nav_profiles, t("nav_profiles")),
    navLink("#/import",   ICONS.nav_import,   t("nav_import")),
    navLink("#/compare",  ICONS.nav_compare,  t("nav_compare")),
    navLink("#/settings", ICONS.nav_settings, t("nav_settings")),
    navLink("#/intro",    ICONS.nav_about,    t("nav_about")),
  );

  // Close mobile menu when any nav link is clicked
  navLinks.addEventListener("click", e => {
    if (e.target.closest("a")) $nav.classList.remove("nav-open");
  });

  const hamburger = h("button", { class: "nav-hamburger", type: "button", "aria-label": "Menu" },
    h("span", { class: "hb-bar" }),
    h("span", { class: "hb-bar" }),
    h("span", { class: "hb-bar" }),
  );
  hamburger.addEventListener("click", e => {
    e.stopPropagation();
    $nav.classList.toggle("nav-open");
  });
  document.addEventListener("click", e => {
    if (!$nav.contains(e.target)) $nav.classList.remove("nav-open");
  }, { capture: false });

  $nav.append(
    h("a", { href: "#/welcome", class: "nav-brand", title: t("nav_home") },
      h("span", { class: "nav-logo" }, "∞"),
      h("span", { class: "nav-title" }, "Relationshape")),
    navLinks,
    buildLangPicker(),
    hamburger,
  );
}

// ---------- Home ----------
function viewHome() {
  const profiles = Store.getProfiles();
  const imports  = Store.getImports();

  if (!profiles.length && !imports.length) {
    $app.append(viewWelcome());
    return;
  }

  $app.append(h("section", { class: "page" },
    h("header", { class: "page-head" },
      h("h1", {}, t("profiles_title")),
      h("p", { class: "muted" }, t("profiles_sub"))),
    h("div", { class: "grid cards" },
      ...profiles.map(profileCard),
      h("button", {
        class: "card card-add",
        onClick: () => navigate("/profile/new"),
      },
        h("div", { class: "card-add-icon" }, "+"),
        h("div", {}, t("new_profile_btn")))
    ),
    imports.length ? h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("imports_title")),
        h("p", { class: "muted" }, t("imports_sub"))),
      h("div", { class: "list" },
        ...imports.map(importCard))
    ) : null,
  ));
}

function viewWelcome() {
  return h("section", { class: "page" },
    // Hero
    h("div", { class: "hero" },
      h("div", { class: "hero-blob" }),
      h("div", { class: "hero-blob hero-blob-holo" }),
      h("div", { class: "hero-constellation", html: heroConstellationSVG() }),
      h("h1", { class: "hero-title" }, t("welcome_title")),
      h("p", { class: "hero-sub" }, t("welcome_sub")),
      h("div", { class: "hero-actions" },
        h("button", { class: "btn btn-primary", onClick: () => navigate("/profile/new") }, t("welcome_cta")),
        h("button", { class: "btn btn-ghost", onClick: () => navigate("/intro") }, t("welcome_about")),
        h("button", { class: "btn btn-ghost", onClick: () => showWizard() }, t("howto_wizard_btn")),
      ),
      // Feature highlight cards
      h("ul", { class: "hero-features" },
        ...[
          [ICONS.feat_security, t("feat_security_title"), t("feat_security_sub")],
          [ICONS.feat_share,    t("feat_share_title"),    t("feat_share_sub")],
          [ICONS.feat_charts,   t("feat_charts_title"),   t("feat_charts_sub")],
          [ICONS.feat_profiles, t("feat_profiles_title"), t("feat_profiles_sub")],
        ].map(([icon, title, sub]) => h("li", {},
          h("span", { class: "hero-feat-icon", html: icon }),
          h("strong", { class: "hero-feat-title" }, title),
          h("span", { class: "hero-feat-sub" }, sub),
        )),
      ),
    ),

    // How-to section
    h("section", { class: "page-section howto-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("howto_title"))),
      h("div", { class: "howto-steps" },
        howtoStep("1", t("howto_step1_title"), t("howto_step1_desc"), ICONS.step_create),
        howtoStep("2", t("howto_step2_title"), t("howto_step2_desc"), ICONS.step_topics),
        howtoStep("3", t("howto_step3_title"), t("howto_step3_desc"), ICONS.step_answer),
        howtoStep("4", t("howto_step4_title"), t("howto_step4_desc"), ICONS.step_share),
      ),
    ),
  );
}

function howtoStep(num, title, desc, iconSvg) {
  return h("div", { class: "howto-step" },
    h("div", { class: "howto-step-icon", html: iconSvg }),
    h("div", { class: "howto-step-num" }, num),
    h("h3", { class: "howto-step-title" }, title),
    h("p", { class: "howto-step-desc muted small" }, desc),
  );
}

async function showWizard() {
  return runWizard(buildWizardSteps());
}

function profileCard(p) {
  const results = Store.getResultsForProfile(p.id);
  const count = results.length;
  const countStr = count === 0
    ? t("no_results")
    : `${count} ${count === 1 ? t("results_count_one") : t("results_count_many")}`;
  return h("a", { class: "card profile-card", href: `#/profile/${p.id}`, style: `--c:${p.color}` },
    h("div", { class: "avatar" }, p.emoji || "✨"),
    h("h3", {}, p.name),
    p.pronouns ? h("p", { class: "muted small" }, p.pronouns) : null,
    h("p", { class: "small" }, countStr),
  );
}

function importCard(imp) {
  const v = imp.version > 1 ? ` (v${imp.version})` : "";
  return h("div", { class: "list-item", style: `--c:${imp.color || "#7c3aed"}` },
    h("div", { class: "li-avatar" }, imp.emoji || "📨"),
    h("div", { class: "li-body" },
      h("h3", {}, (imp.name || "Imported result") + v),
      h("p", { class: "muted small" }, `${esc(imp.subject || "—")}${v} · ${t("imported_on")} ${fmtDate(imp.importedAt)}`)),
    h("div", { class: "li-actions" },
      h("button", { class: "btn", onClick: () => navigate("/compare?ids=imp:" + imp.id) }, t("btn_compare")),
      h("button", { class: "btn btn-danger-ghost", onClick: async () => {
        if (await dlgConfirm(t("confirm_delete_map"), { danger: true, okLabel: t("btn_delete") })) {
          Store.deleteImport(imp.id); route();
        }
      }}, t("btn_delete")))
  );
}

// ---------- Profile create / edit ----------
function viewProfileEdit(id) {
  const profile = id ? Store.getProfile(id) : { name: "", pronouns: "", color: "#7c3aed", emoji: "🌷" };
  if (id && !profile) return navigate("/");

  const form = h("form", { class: "form profile-form", onSubmit: e => {
    e.preventDefault();
    const fd = new FormData(form);
    const patch = {
      name: (fd.get("name") || "").trim() || "Unnamed",
      pronouns: fd.get("pronouns") || "",
      color: fd.get("color"),
      emoji: (fd.get("emoji") || "").trim() || "✨",
    };
    if (id) { Store.updateProfile(id, patch); navigate(`/profile/${id}`); }
    else { const p = Store.createProfile(patch); navigate(`/profile/${p.id}`); }
  }},
    h("h1", {}, id ? t("profile_edit_title") : t("profile_new_title")),
    h("label", {}, t("profile_name_label"),
      h("input", { name: "name", value: profile.name, required: true, autofocus: true, placeholder: t("profile_name_placeholder") })),
    h("label", {}, t("profile_pronouns_label"),
      h("input", { name: "pronouns", value: profile.pronouns, placeholder: t("profile_pronouns_placeholder") })),
    h("label", {}, t("profile_emoji_label"),
      h("div", { class: "emoji-field" },
        h("input", { name: "emoji", id: "emoji-input", value: profile.emoji, maxlength: 6, placeholder: "🌷" }),
        h("button", { class: "btn", type: "button",
          onClick: async () => {
            const v = await pickEmojiDialog(document.getElementById("emoji-input")?.value || profile.emoji);
            if (v) document.getElementById("emoji-input").value = v;
          },
        }, t("profile_emoji_pick")))),
    h("label", {}, t("profile_color_label"),
      h("input", { name: "color", type: "color", value: profile.color })),
    h("div", { class: "form-actions" },
      h("button", { class: "btn btn-primary", type: "submit" }, id ? t("btn_save") : t("btn_create_profile")),
      h("button", { class: "btn btn-ghost", type: "button", onClick: () => history.back() }, t("btn_cancel")),
      id ? h("button", { class: "btn btn-danger", type: "button", onClick: async () => {
        if (await dlgConfirm(t("confirm_delete_profile"), { danger: true, okLabel: t("btn_delete_profile") })) {
          Store.deleteProfile(id); navigate("/");
        }
      }}, t("btn_delete_profile")) : null,
    ),
  );

  $app.append(h("section", { class: "page narrow" }, form));
}

// ---------- Profile detail ----------
function viewProfile(id) {
  const profile = Store.getProfile(id);
  if (!profile) return navigate("/");
  const results = Store.getResultsForProfile(id);

  $app.append(h("section", { class: "page" },
    h("header", { class: "profile-head", style: `--c:${profile.color}` },
      h("div", { class: "avatar avatar-lg" }, profile.emoji),
      h("div", {},
        h("h1", {}, profile.name),
        profile.pronouns ? h("p", { class: "muted" }, profile.pronouns) : null),
      h("div", { class: "flex-spacer" }),
      h("button", { class: "btn", onClick: () => navigate(`/profile/${id}/edit`) }, t("btn_edit")),
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("maps_title")),
        h("p", { class: "muted" }, t("maps_sub"))),
      h("div", { class: "list" },
        ...results.map(r => resultCard(r, profile)),
        h("button", { class: "list-add", onClick: () => createNewResult(profile.id) },
          t("btn_new_map"))),
    ),
  ));
}

function resultCard(r, profile) {
  const cat = r.subjectColor || profile.color;
  const title = (r.subject || "Untitled") + (r.version > 1 ? ` (v${r.version})` : "");
  return h("div", { class: "list-item", style: `--c:${cat}` },
    h("div", { class: "li-avatar" }, r.subjectEmoji || "💞"),
    h("div", { class: "li-body" },
      h("h3", {}, title),
      h("p", { class: "muted small" }, `${t("updated")} ${fmtDate(r.updatedAt)} · ${countAnswers(r)} ${t("answers")}`)),
    h("div", { class: "li-actions" },
      h("button", { class: "btn btn-primary", onClick: () => navigate(`/q-categories/${profile.id}/${r.id}`) }, t("btn_continue")),
      h("button", { class: "btn", onClick: () => navigate(`/result/${r.id}`) }, t("btn_view")),
      h("button", { class: "btn", onClick: () => navigate(`/share/${r.id}`) }, t("btn_share")),
      h("button", { class: "btn btn-danger-ghost", onClick: async () => {
        if (await dlgConfirm(t("confirm_delete_map"), { danger: true, okLabel: t("btn_delete") })) {
          Store.deleteResult(r.id); route();
        }
      }}, "🗑"))
  );
}

function countAnswers(r) {
  let n = 0;
  for (const c of Object.values(r.answers || {})) {
    for (const k of Object.keys(c)) {
      if (k === "__custom") n += Object.keys(c.__custom || {}).length;
      else if (c[k]?.scale) n++;
    }
  }
  return n;
}

function viewCategoryOverview(profileId, resultId) {
  const profile = Store.getProfile(profileId);
  const result = Store.getResult(resultId);
  if (!profile || !result || result.profileId !== profileId) return navigate("/");

  const enabledCats = enabledCategoryList(result);
  if (!enabledCats.length) return navigate(`/result/${resultId}`);

  function isItemAnswered(entry, cat) {
    if (!entry) return false;
    return cat.gr ? (!!(entry.giving || entry.receiving)) : !!entry.scale;
  }

  function catProgress(cat) {
    const slot = result.answers?.[cat.id] || {};
    const asked = askedItemsForCat(result, cat.id);
    const baseItems = asked ? asked.base : cat.items;
    const customNames = asked
      ? Array.from(new Set([...(asked.custom || []), ...Object.keys(slot.__custom || {})]))
      : Object.keys(slot.__custom || {});
    const total = baseItems.length + customNames.length;
    let answered = 0;
    for (const item of baseItems) { if (isItemAnswered(slot[item], cat)) answered++; }
    for (const name of customNames) { if (isItemAnswered(slot.__custom?.[name], cat)) answered++; }
    return { answered, total };
  }

  const lang = getLang();

  $app.append(h("section", { class: "page narrow" },
    h("button", { class: "btn btn-ghost", onClick: () => navigate(`/profile/${profileId}`) }, t("btn_back")),
    h("div", { class: "cat-overview-header" },
      h("div", { class: "li-avatar", style: `--c:${result.subjectColor || "#7c3aed"}` }, result.subjectEmoji || "💞"),
      h("div", {},
        h("h1", {}, t("btn_categories")),
        h("p", { class: "muted small" }, result.subject + " · " + (profile.emoji || "") + " " + profile.name)),
    ),
    h("div", { class: "cat-overview-grid" },
      ...enabledCats.map((cat, i) => {
        const { answered, total } = catProgress(cat);
        const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
        const done = answered >= total && total > 0;
        const catTitle = lang === "de" && cat.de ? cat.de : cat.title;
        return h("button", {
          class: "cat-overview-tile" + (done ? " is-done" : ""),
          style: `--c:${cat.color}`,
          onClick: () => {
            result.progress = result.progress || {};
            result.progress.catIndex = i;
            Store.saveResult(result);
            navigate(`/q/${profileId}/${resultId}`);
          },
        },
          h("span", { class: "cat-overview-icon" }, cat.icon),
          h("div", { class: "cat-overview-body" },
            h("span", { class: "cat-overview-title" }, catTitle),
            h("div", { class: "cat-overview-bar-wrap" },
              h("div", { class: "cat-overview-bar", style: `width:${pct}%; background:${cat.color}` })),
            h("span", { class: "cat-overview-pct muted small" }, done ? "✓ " + t("q_done_title") : `${answered}/${total}`),
          ),
        );
      })
    ),
    h("div", { class: "form-actions" },
      h("button", { class: "btn btn-ghost", onClick: () => openAddCategoriesDialog(profileId, resultId) }, t("btn_add_categories")),
      h("button", { class: "btn btn-primary", onClick: () => navigate(`/result/${resultId}`) }, t("btn_see_results")),
    ),
  ));
}

async function createNewResult(profileId) {
  const imports = Store.getImports();

  const choice = await dialog({
    title: t("new_map_title"),
    body: (close) => h("div", { class: "start-choices" },
      h("button", { class: "start-card", type: "button", onClick: () => close("blank") },
        h("div", { class: "start-icon" }, "✨"),
        h("div", { class: "start-body" },
          h("h3", {}, t("start_blank_title")),
          h("p", { class: "muted small" }, t("start_blank_desc")))),
      imports.length ? h("button", { class: "start-card", type: "button", onClick: () => close("import") },
        h("div", { class: "start-icon" }, "📥"),
        h("div", { class: "start-body" },
          h("h3", {}, t("start_import_title")),
          h("p", { class: "muted small" }, `${t("start_import_desc")} ${imports.length} ${imports.length>1 ? t("start_import_desc_count_many") : t("start_import_desc_count_one")}`))) : null,
    ),
    actions: [{ label: t("btn_cancel"), kind: "ghost", value: null }],
  });
  if (!choice) return;

  if (choice === "import") return startFromImport(profileId);
  return startBlank(profileId);
}

async function startBlank(profileId) {
  const subject = await dlgPrompt({
    title: t("new_map_title"),
    label: t("map_name_label"),
    placeholder: "e.g. Sam, my best friend",
    okLabel: t("btn_next"),
  });
  if (!subject) return;

  const selectedCatIds = await runCategoryPicker(null);
  if (selectedCatIds === false) return;

  const enabledCategories = selectedCatIds;

  const chosenScale = await promptScaleForNewCard();
  if (chosenScale === null) return;

  const version = Store.nextResultVersion(profileId, subject);
  const r = Store.saveResult({
    profileId, subject: subject.trim(),
    subjectEmoji: pickEmoji(),
    subjectColor: pickColor(),
    answers: {},
    scale: chosenScale,
    enabledCategories,
    askedItems: null,
    progress: { catIndex: 0 },
    version,
  });
  navigate(`/q-categories/${profileId}/${r.id}`);
}

async function startFromImport(profileId) {
  const imports = Store.getImports();
  if (!imports.length) return;

  const chosen = await dialog({
    title: t("pick_import_title"),
    body: (close) => h("div", { class: "compare-grid" },
      ...imports.map(imp => h("button", {
        class: "compare-tile", type: "button",
        style: `--c:${imp.color || "#7c3aed"}`,
        onClick: () => close(imp.id),
      },
        h("div", { class: "li-avatar" }, imp.emoji || "📨"),
        h("div", { class: "compare-tile-body" },
          h("h3", {}, importLabel(imp)),
          h("p", { class: "muted small" }, `${t("imported_on")} ${fmtDate(imp.importedAt)}`)),
        h("span", { class: "compare-tile-arrow" }, "→")))
    ),
    actions: [{ label: t("btn_cancel"), kind: "ghost", value: null }],
  });
  if (!chosen) return;
  const imp = imports.find(i => i.id === chosen);
  if (!imp) return;

  const subject = await dlgPrompt({
    title: t("your_version_title"),
    label: t("your_version_label", { name: imp.name, subject: imp.subject }),
    placeholder: imp.subject,
    value: imp.subject,
    okLabel: t("btn_create"),
  });
  if (!subject) return;

  const askedItems = {};
  const enabledCategories = [];
  for (const cat of CATEGORIES) {
    const slot = imp.answers?.[cat.id];
    if (!slot) continue;
    const base = cat.items.filter(it => slot[it]?.scale);
    const custom = Object.keys(slot.__custom || {}).filter(k => slot.__custom[k]?.scale);
    if (base.length || custom.length) {
      askedItems[cat.id] = { base, custom };
      enabledCategories.push(cat.id);
    }
  }

  const seededAnswers = {};
  for (const [catId, { custom }] of Object.entries(askedItems)) {
    if (!custom.length) continue;
    seededAnswers[catId] = { __custom: Object.fromEntries(custom.map(n => [n, {}])) };
  }

  const version = Store.nextResultVersion(profileId, subject);
  const r = Store.saveResult({
    profileId, subject: subject.trim(),
    subjectEmoji: imp.emoji || pickEmoji(),
    subjectColor: imp.color || pickColor(),
    answers: seededAnswers,
    scale: cloneScale(imp.scale || Store.getScale()),
    enabledCategories,
    askedItems,
    progress: { catIndex: 0 },
    version,
    seededFromImportId: imp.id,
  });
  showToast(t("seeded_toast", { name: importLabel(imp) }));
  navigate(`/q/${profileId}/${r.id}`);
}

function cloneScale(s) { return (s || []).map(x => ({ ...x })); }

function resolveAnswerKey(customKey, itemScale, resultScale) {
  if (resultScale.some(s => s.key === customKey)) return customKey;
  const idx = itemScale.findIndex(s => s.key === customKey);
  if (idx < 0) return customKey;
  const norm = idx / Math.max(1, itemScale.length - 1);
  const ri = Math.round(norm * (resultScale.length - 1));
  return resultScale[ri].key;
}

function findActiveItemScaleKey(storedKey, itemScale, resultScale) {
  if (itemScale.some(s => s.key === storedKey)) return storedKey;
  const ri = resultScale.findIndex(s => s.key === storedKey);
  if (ri < 0) return null;
  const norm = ri / Math.max(1, resultScale.length - 1);
  const ii = Math.round(norm * (itemScale.length - 1));
  return itemScale[ii]?.key || null;
}

async function promptScaleForNewCard() {
  const defaultScale = cloneScale(Store.getScale());

  while (true) {
    const choice = await dialog({
      title: t("new_card_scale_title"),
      body: () => h("div", { class: "scale-dialog-body" },
        h("p", { class: "muted small" }, t("new_card_scale_sub")),
        h("div", { class: "scale-legend-header" },
          h("span", {}),
          h("span", {}, t("scale_col_color")),
          h("span", {}, t("scale_col_label")),
          h("span", {}, t("scale_col_short")),
          h("span", {}),
        ),
        h("div", { class: "scale-preview-list" },
          ...defaultScale.map(s => h("div", { class: "scale-preview-row" },
            h("div", { class: "scale-preview-swatch", style: `background:${s.color}` }),
            h("span", { class: "scale-preview-label" }, s.label),
            h("span", { class: "scale-preview-short muted small" }, s.short),
          ))
        ),
      ),
      actions: [
        { label: t("btn_cancel"), kind: "ghost", value: null },
        { label: t("new_card_scale_customize"), kind: "ghost", value: "customize" },
        { label: t("new_card_scale_confirm"), kind: "primary", primary: true, value: "use" },
      ],
    });

    if (!choice) return null;
    if (choice === "use") return cloneScale(defaultScale);

    const edited = await promptEditScaleDialog(defaultScale);
    if (edited === "BACK") continue;
    if (!edited) return null;
    return edited;
  }
}

async function promptEditScaleDialog(initialScale) {
  const scaleRef = cloneScale(initialScale);
  const listEl = h("div", { class: "scale-editor" });

  function rerenderList() {
    listEl.innerHTML = "";
    scaleRef.forEach((s, i) => {
      const row = h("div", { class: "scale-row", style: `--c:${s.color}` },
        h("div", { class: "scale-row-rank" }, `${scaleRef.length - i}`),
        h("input", { class: "scale-row-color", type: "color", value: s.color,
          onInput: e => { scaleRef[i].color = e.target.value; } }),
        h("input", { class: "scale-row-label", type: "text", value: s.label, placeholder: t("scale_step_label"),
          onChange: e => { scaleRef[i].label = e.target.value || s.label; } }),
        h("input", { class: "scale-row-short", type: "text", value: s.short, maxlength: 24, placeholder: t("scale_step_short"),
          onChange: e => { scaleRef[i].short = e.target.value || s.short; } }),
        h("input", { class: "scale-row-desc", type: "text", value: s.description || "", placeholder: t("scale_step_desc"),
          onChange: e => { scaleRef[i].description = e.target.value; } }),
        h("div", { class: "scale-row-actions" },
          h("button", { class: "icon-btn", title: "Move up", disabled: i === 0,
            onClick: () => { const tmp = scaleRef[i]; scaleRef[i] = scaleRef[i - 1]; scaleRef[i - 1] = tmp; rerenderList(); } }, "↑"),
          h("button", { class: "icon-btn", title: "Move down", disabled: i === scaleRef.length - 1,
            onClick: () => { const tmp = scaleRef[i]; scaleRef[i] = scaleRef[i + 1]; scaleRef[i + 1] = tmp; rerenderList(); } }, "↓"),
          h("button", { class: "icon-btn danger", title: "Remove", disabled: scaleRef.length <= 2,
            onClick: () => { scaleRef.splice(i, 1); rerenderList(); } }, "🗑"),
        ),
      );
      listEl.append(row);
    });
  }

  rerenderList();

  const result = await dialog({
    title: t("new_card_scale_title"),
    body: () => h("div", { class: "scale-dialog-body" },
      h("div", { class: "scale-legend-header" },
        h("span", {}),
        h("span", {}, t("scale_col_color")),
        h("span", {}, t("scale_col_label")),
        h("span", {}, t("scale_col_short")),
        h("span", {}),
      ),
      listEl,
    ),
    actions: [
      { label: t("btn_cancel"), kind: "ghost", value: "BACK" },
      { label: t("new_card_scale_confirm"), kind: "primary", primary: true,
        handler: () => cloneScale(scaleRef) },
    ],
  });

  return result ?? "BACK";
}

async function editItemScaleDialog(currentItemScale, resultScale) {
  const scaleRef = cloneScale(currentItemScale);
  const listEl = h("div", { class: "scale-editor" });

  function rerenderList() {
    listEl.innerHTML = "";
    scaleRef.forEach((s, i) => {
      const row = h("div", { class: "scale-row", style: `--c:${s.color}` },
        h("div", { class: "scale-row-rank" }, `${scaleRef.length - i}`),
        h("input", { class: "scale-row-color", type: "color", value: s.color,
          onInput: e => { scaleRef[i].color = e.target.value; } }),
        h("input", { class: "scale-row-label", type: "text", value: s.label, placeholder: t("scale_step_label"),
          onChange: e => { scaleRef[i].label = e.target.value || s.label; } }),
        h("input", { class: "scale-row-short", type: "text", value: s.short, maxlength: 24, placeholder: t("scale_step_short"),
          onChange: e => { scaleRef[i].short = e.target.value || s.short; } }),
        h("input", { class: "scale-row-desc", type: "text", value: s.description || "", placeholder: t("scale_step_desc"),
          onChange: e => { scaleRef[i].description = e.target.value; } }),
        h("div", { class: "scale-row-actions" },
          h("button", { class: "icon-btn", title: "Move up", disabled: i === 0,
            onClick: () => { const tmp = scaleRef[i]; scaleRef[i] = scaleRef[i - 1]; scaleRef[i - 1] = tmp; rerenderList(); } }, "↑"),
          h("button", { class: "icon-btn", title: "Move down", disabled: i === scaleRef.length - 1,
            onClick: () => { const tmp = scaleRef[i]; scaleRef[i] = scaleRef[i + 1]; scaleRef[i + 1] = tmp; rerenderList(); } }, "↓"),
          h("button", { class: "icon-btn danger", title: "Remove", disabled: scaleRef.length <= 2,
            onClick: () => { scaleRef.splice(i, 1); rerenderList(); } }, "🗑"),
        ),
      );
      listEl.append(row);
    });
  }

  rerenderList();

  return dialog({
    title: t("item_edit_scale"),
    body: () => listEl,
    actions: [
      { label: t("btn_cancel"), kind: "ghost", value: null },
      { label: t("item_reset_answer"), kind: "ghost",
        handler: () => ({ __clearAnswer: true, scale: cloneScale(scaleRef) }) },
      { label: t("new_card_scale_confirm"), kind: "primary", primary: true,
        handler: () => cloneScale(scaleRef) },
    ],
  });
}

// Category picker for onboarding and "add more categories" flow.
// Pass existingIds (array) to pre-check + disable already-selected categories,
// or null to use the CATEGORY_GROUPS defaults.
// Returns array of selected category IDs, null for "include everything", or false for cancelled.
async function runCategoryPicker(existingIds) {
  const lang = getLang();
  // Build checked state: defaultOn for new maps, all existing + defaultOn for add-more
  const checkedIds = new Set(existingIds !== null ? existingIds : []);
  const lockedIds = new Set(existingIds || []);

  return dialog({
    title: t("onboarding_title"),
    body: () => h("div", { class: "onboarding-body" },
      h("p", { class: "muted small" }, t("onboarding_sub")),
      h("div", { class: "cat-picker-groups" },
        ...CATEGORY_GROUPS.map(group => {
          const groupTitle = lang === "de" ? group.de : group.en;
          return h("div", { class: "cat-picker-group" },
            h("h3", { class: "cat-picker-group-title" }, groupTitle),
            h("div", { class: "cat-picker-items" },
              ...group.categories.map(({ id }) => {
                const cat = CATEGORIES.find(c => c.id === id);
                if (!cat) return null;
                const catTitle = lang === "de" && cat.de ? cat.de : cat.title;
                const locked = lockedIds.has(id);
                const isChecked = checkedIds.has(id);
                const checkEl = h("input", {
                  type: "checkbox",
                  id: "cp-" + id,
                  checked: isChecked,
                  disabled: locked,
                  onChange: e => {
                    e.target.checked ? checkedIds.add(id) : checkedIds.delete(id);
                    label.classList.toggle("is-checked", e.target.checked);
                    checkMark.textContent = e.target.checked ? "✓" : "";
                  },
                });
                const checkMark = h("span", { class: "cat-picker-check" }, isChecked ? "✓" : "");
                const label = h("label", {
                  for: "cp-" + id,
                  class: "cat-picker-item" + (locked ? " is-locked" : "") + (isChecked ? " is-checked" : ""),
                },
                  checkEl,
                  h("span", { class: "cat-picker-icon" }, cat.icon),
                  h("span", { class: "cat-picker-label" }, catTitle),
                  locked ? h("span", { class: "cat-picker-lock" }, "✓") : checkMark,
                );
                return label;
              }).filter(Boolean)
            )
          );
        })
      )
    ),
    actions: [
      ...(existingIds === null ? [{
        label: t("btn_select_all_continue"), kind: "ghost",
        handler: () => {
          const all = CATEGORY_GROUPS.flatMap(g => g.categories.map(c => c.id));
          return all;
        },
      }] : []),
      { label: existingIds ? t("btn_add_categories") : t("btn_start_map"), kind: "primary", primary: true,
        handler: () => {
          if (checkedIds.size === 0) throw new Error(t("onboarding_empty_warning"));
          return Array.from(checkedIds);
        } },
    ],
  }).catch(() => false);
}

async function openAddCategoriesDialog(profileId, resultId) {
  const result = Store.getResult(resultId);
  if (!result) return;
  const existing = result.enabledCategories || CATEGORIES.map(c => c.id);
  const newIds = await runCategoryPicker(existing);
  if (!newIds || newIds === false) return;
  // Merge: union of existing + newly selected
  const merged = Array.from(new Set([...existing, ...newIds]));
  result.enabledCategories = merged;
  // Generate askedItems for newly added categories
  result.askedItems = result.askedItems || {};
  for (const catId of merged) {
    if (!result.askedItems[catId]) {
      const cat = CATEGORIES.find(c => c.id === catId);
      if (cat) result.askedItems[catId] = { base: cat.items.slice(), custom: [] };
    }
  }
  Store.saveResult(result);
  navigate(`/q-categories/${profileId}/${resultId}`);
}

function pickEmoji() {
  const list = ["💞","🌹","🪻","🌌","🧡","🌊","🪐","🍑","✨","🦋","🍀"];
  return list[Math.floor(Math.random() * list.length)];
}
function pickColor() {
  const list = ["#ec4899","#f97316","#22c55e","#06b6d4","#a78bfa","#f59e0b","#ef4444"];
  return list[Math.floor(Math.random() * list.length)];
}

// ---------- Questionnaire flow ----------
function viewQuestionnaire(profileId, resultId) {
  const profile = Store.getProfile(profileId);
  const result = Store.getResult(resultId);
  if (!profile || !result || result.profileId !== profileId) return navigate("/");

  const mode = result.progress?.mode || "list";
  if (mode === "single") return viewQuestionnaireSingle(profile, result);
  return viewQuestionnaireList(profile, result);
}

function setMode(result, mode) {
  result.progress = result.progress || {};
  const prevMode = result.progress.mode;
  result.progress.mode = mode;
  if (prevMode === "single" && mode === "list") {
    const items = flatItemsForResult(result);
    const cur = items[clamp(result.progress.flatIndex ?? 0, 0, items.length - 1)];
    if (cur) {
      const enabledCats = enabledCategoryList(result);
      const idx = enabledCats.findIndex(c => c.id === cur.catId);
      if (idx >= 0) result.progress.catIndex = idx;
      result.progress.focusItem = { catId: cur.catId, item: cur.item, isCustom: cur.isCustom };
    }
  } else if (prevMode === "list" && mode === "single") {
    const enabledCats = enabledCategoryList(result);
    const cat = enabledCats[clamp(result.progress.catIndex ?? 0, 0, enabledCats.length - 1)];
    if (cat) {
      const items = flatItemsForResult(result);
      const idx = items.findIndex(it => it.catId === cat.id);
      if (idx >= 0) result.progress.flatIndex = idx;
    }
  }
  Store.saveResult(result);
}

function flatItemsForResult(result) {
  const enabledCats = enabledCategoryList(result);
  const items = [];
  enabledCats.forEach(cat => {
    const asked = askedItemsForCat(result, cat.id);
    const baseList = asked ? asked.base : cat.items;
    baseList.forEach(item => items.push({ catId: cat.id, item, isCustom: false, cat }));
    const cust = result.answers?.[cat.id]?.__custom || {};
    const customNames = asked
      ? Array.from(new Set([...(asked.custom || []), ...Object.keys(cust)]))
      : Object.keys(cust);
    customNames.forEach(name => items.push({ catId: cat.id, item: name, isCustom: true, cat }));
  });
  return items;
}

function viewQuestionnaireList(profile, result) {
  const profileId = profile.id;
  const resultId = result.id;
  const enabledCats = enabledCategoryList(result);
  if (!enabledCats.length) return navigate(`/result/${resultId}`);

  const safeIdx = clamp(result.progress?.catIndex ?? 0, 0, enabledCats.length - 1);
  const cat = enabledCats[safeIdx];

  const total = enabledCats.length;
  const progressPct = ((safeIdx + 1) / total) * 100;
  const idx = safeIdx;

  result.answers = result.answers || {};
  result.answers[cat.id] = result.answers[cat.id] || {};
  const answers = result.answers[cat.id];
  answers.__custom = answers.__custom || {};

  const SCALE = getResultScale(result);
  const asked = askedItemsForCat(result, cat.id);
  const baseItems = asked ? asked.base : cat.items;
  const customNames = asked
    ? Array.from(new Set([...(asked.custom || []), ...Object.keys(answers.__custom)]))
    : Object.keys(answers.__custom);
  const _lang = getLang();

  const root = h("section", { class: "page q-page" },
    qHeader({ profileId, resultId, idx, total, cat, progressPct, result, mode: "list", isItemBased: false }),
    h("section", { class: "q-cat", style: `--c:${cat.color}` },
      h("div", { class: "q-cat-head" },
        h("span", { class: "q-cat-icon" }, cat.icon),
        h("div", {},
          h("h1", {}, getCatTitle(cat, _lang)),
          h("p", { class: "muted" }, _lang === "de" && cat.deBlurb ? cat.deBlurb : cat.blurb),
          cat.gr ? h("p", { class: "muted small" }, t("q_gr_tip")) : null,
          h("p", { class: "muted small" }, t("q_keyboard_tip", { n: SCALE.length, m: SCALE.length + 1 }))
        ),
      ),
      h("div", { class: "scale-legend" }, ...SCALE.map((s, i) =>
        h("span", { class: "chip", style: `--c:${s.color}`, title: s.description || "" },
          h("span", { class: "chip-num" }, String(i + 1)), " ", s.label))),

      h("div", { class: "q-items" },
        ...baseItems.map(item => itemRow(cat, item, answers, false, SCALE)),
        ...customNames.map(name => itemRow(cat, name, answers.__custom, true, SCALE)),
        h("button", { class: "q-add", onClick: async () => {
          const name = await dlgPrompt({
            title: t("add_custom_title"),
            label: t("add_custom_label"),
            placeholder: t("add_custom_placeholder"),
            okLabel: t("btn_add"),
          });
          if (!name) return;
          if (cat.items.includes(name) || answers.__custom[name]) {
            return showToast(t("item_already_exists"));
          }
          answers.__custom[name] = { scale: "open" };
          persist(); rerender();
        }}, t("btn_add_custom")),
      ),
    ),

    h("nav", { class: "q-nav" },
      h("button", { class: "btn", disabled: idx === 0, onClick: () => move(-1) }, t("btn_previous")),
      h("button", { class: "btn", onClick: () => navigate(`/result/${resultId}`) }, t("btn_skip_results")),
      h("button", { class: "btn btn-primary", onClick: () => move(1) }, t("btn_next")),
    )
  );

  $app.append(root);

  let target = null;
  const focusItem = result.progress?.focusItem;
  if (focusItem && focusItem.catId === cat.id) {
    target = Array.from(root.querySelectorAll(".q-item")).find(el =>
      el.dataset.itemKey === focusItem.item);
    delete result.progress.focusItem;
    Store.saveResult(result);
  }
  if (!target) {
    target = Array.from(root.querySelectorAll(".q-item")).find(el => !el.dataset.answered)
      || root.querySelector(".q-item");
  }
  if (target) {
    target.focus({ preventScroll: true });
  }

  function persist() { Store.saveResult(result); }
  function move(d) {
    result.progress = result.progress || {};
    result.progress.catIndex = Math.max(0, Math.min(total - 1, idx + d));
    persist();
    if (d > 0) navigate(`/q-categories/${profileId}/${resultId}`);
    else route();
  }
  function rerender() { $app.innerHTML = ""; viewQuestionnaireList(profile, result); }

  function itemRow(cat, item, store, isCustom, SCALE) {
    const existing = store[item] || {};
    const itemScale = existing.itemScale || null;
    const activeScale = itemScale || SCALE;
    const answered = cat.gr
      ? !!(existing.giving || existing.receiving)
      : !!existing.scale;

    function clearAnswers() {
      const saved = store[item] || {};
      const kept = {};
      if (saved.itemScale) kept.itemScale = saved.itemScale;
      if (saved.note) kept.note = saved.note;
      if (Object.keys(kept).length) store[item] = kept;
      else delete store[item];
    }

    const row = h("div", {
      class: "q-item" + (answered ? " is-answered" : "") + (cat.gr ? " is-gr" : ""),
      tabindex: "0",
      "data-answered": answered ? "1" : null,
      "data-item-key": item,
    },
      h("div", { class: "q-item-name" },
        isCustom ? h("span", { class: "q-item-tag" }, t("custom_tag")) : null,
        isCustom ? item : getItemLabel(cat, item, _lang),
        h("button", { class: "btn btn-ghost item-scale-btn", type: "button",
          onClick: async e => {
            e.stopPropagation();
            if (answered) {
              if (!await dlgConfirm(t("item_scale_change_warning"), { okLabel: t("btn_ok") })) return;
              clearAnswers();
              persist();
            }
            const newItemScale = await editItemScaleDialog(itemScale || cloneScale(SCALE), SCALE);
            if (!newItemScale) { rerender(); return; }
            store[item] = { ...(store[item] || {}), itemScale: newItemScale };
            if (cat.gr) { delete store[item].giving; delete store[item].receiving; }
            else delete store[item].scale;
            persist(); rerender();
          }
        }, t("item_edit_scale")),
        isCustom ? h("button", { class: "icon-btn", title: t("btn_delete"), onClick: e => {
          e.stopPropagation();
          delete store[item]; persist(); rerender();
        }}, "✕") : null
      ),
      cat.gr
        ? h("div", { class: "q-gr-sliders" },
            h("div", { class: "q-gr-row" },
              h("span", { class: "q-gr-label" }, t("lbl_giving")),
              scaleSliderEl({
                scale: activeScale,
                valueKey: itemScale ? findActiveItemScaleKey(existing.giving, itemScale, SCALE) : existing.giving,
                onChange: key => applyGrKey("giving", key),
                onClear: () => applyGrKey("giving", null),
              }),
            ),
            h("div", { class: "q-gr-row" },
              h("span", { class: "q-gr-label" }, t("lbl_receiving")),
              scaleSliderEl({
                scale: activeScale,
                valueKey: itemScale ? findActiveItemScaleKey(existing.receiving, itemScale, SCALE) : existing.receiving,
                onChange: key => applyGrKey("receiving", key),
                onClear: () => applyGrKey("receiving", null),
              }),
            ),
          )
        : h("div", { class: "q-slider-wrap" },
            scaleSliderEl({
              scale: activeScale,
              valueKey: itemScale
                ? findActiveItemScaleKey(existing.scale, itemScale, SCALE)
                : existing.scale,
              onChange: key => applyScale(key),
              onClear: () => applyScale(null),
            }),
          ),
      h("input", {
        class: "q-note",
        type: "text",
        placeholder: t("note_placeholder"),
        value: existing.note || "",
        onChange: e => { store[item] = { ...(store[item] || {}), note: e.target.value }; persist(); }
      }),
    );

    function applyGrKey(direction, key) {
      const saved = { ...(store[item] || {}) };
      if (key == null) {
        delete saved[direction];
      } else {
        saved[direction] = itemScale ? resolveAnswerKey(key, itemScale, SCALE) : key;
        if (itemScale) saved.itemScale = itemScale;
      }
      const hasContent = saved.giving || saved.receiving || saved.note || saved.itemScale;
      if (hasContent) store[item] = saved;
      else delete store[item];
      persist();
      rerender();
    }

    function applyScale(key, { advance = true } = {}) {
      if (key == null) {
        clearAnswers();
      } else {
        const resultKey = itemScale ? resolveAnswerKey(key, itemScale, SCALE) : key;
        store[item] = { ...existing, scale: resultKey };
        if (itemScale) store[item].itemScale = itemScale;
      }
      persist();
      const next = advance && key != null ? nextItemElement(row) : null;
      rerender();
      if (next) {
        requestAnimationFrame(() => {
          const all = Array.from(document.querySelectorAll(".q-item"));
          const idx = parseInt(next.dataset.idx || "-1", 10);
          const el = idx >= 0 ? all[idx] : null;
          if (!el) return;
          el.focus({ preventScroll: true });
        });
      }
    }

    function nextItemElement(current) {
      const all = Array.from(document.querySelectorAll(".q-item"));
      const i = all.indexOf(current);
      const next = all[i + 1];
      if (next) next.dataset.idx = String(all.indexOf(next));
      return next;
    }

    row.addEventListener("keydown", e => {
      if (e.target !== row) return;
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= activeScale.length) {
        e.preventDefault();
        applyScale(activeScale[n - 1].key);
      } else if (e.key === "0" || (!isNaN(n) && n === activeScale.length + 1)) {
        e.preventDefault();
        applyScale(null, { advance: false });
      } else if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        const all = Array.from(document.querySelectorAll(".q-item"));
        const i = all.indexOf(row);
        all[i + 1]?.focus({ preventScroll: true });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const all = Array.from(document.querySelectorAll(".q-item"));
        const i = all.indexOf(row);
        all[i - 1]?.focus({ preventScroll: true });
      }
    });

    return row;
  }
}

function qHeader({ profileId, resultId, idx, total, cat, progressPct, result, mode, isItemBased }) {
  const _qlang = getLang();
  const stepLabel = isItemBased
    ? `${t("q_item")} ${idx + 1} ${t("q_of")} ${total}`
    : `${t("q_category")} ${idx + 1} ${t("q_of")} ${total}`;
  return h("header", { class: "q-head" },
    h("button", { class: "btn btn-cats-back", onClick: () => navigate(`/q-categories/${profileId}/${resultId}`) }, "← " + t("btn_categories")),
    h("div", { class: "q-progress" },
      h("div", { class: "q-progress-bar" },
        h("div", { class: "q-progress-fill", style: `width:${progressPct}%; background:${cat.color}` })),
      h("div", { class: "q-progress-text" },
        h("span", { class: "q-cat-pip" }, cat.icon, " ", getCatTitle(cat, _qlang)),
        ` · ${stepLabel} · ${result.subject}`),
    ),
    h("div", { class: "q-mode-switch" },
      h("button", {
        class: "btn" + (mode === "list" ? " is-active" : ""),
        onClick: () => { setMode(result, "list"); route(); },
        title: "Show all items in this category at once",
      }, "📋 List"),
      h("button", {
        class: "btn" + (mode === "single" ? " is-active" : ""),
        onClick: () => { setMode(result, "single"); route(); },
        title: "One item at a time",
      }, "📱 Single"),
    ),
    h("button", {
      class: "btn icon-only",
      title: "Keyboard shortcuts",
      "aria-label": "Keyboard shortcuts",
      onClick: () => showKeyboardHelpDialog(mode),
    }, "⌨️"),
    h("button", { class: "btn", onClick: () => navigate(`/result/${resultId}`) }, t("btn_results")),
  );
}

// ---------- Single questionnaire ----------
function viewQuestionnaireSingle(profile, result) {
  const profileId = profile.id;
  const resultId = result.id;
  const SCALE = getResultScale(result);
  const enabledCats = enabledCategoryList(result);
  if (!enabledCats.length) return navigate(`/result/${resultId}`);
  const items = flatItemsForResult(result);
  if (!items.length) return;

  let cursor = clamp(result.progress?.flatIndex ?? 0, 0, items.length - 1);
  const stack = h("div", { class: "q-stack" });

  const isMobile = matchMedia("(pointer: coarse)").matches;
  const root = h("section", { class: "page q-page q-single-page" },
    qHeader({
      profileId, resultId,
      idx: cursor, total: items.length, isItemBased: true,
      cat: items[cursor].cat,
      progressPct: ((cursor + 1) / items.length) * 100,
      result, mode: "single",
    }),
    h("p", { class: "q-nav-hint muted small" },
      isMobile ? t("q_single_hint_mobile") : t("q_single_hint_desktop")),
    stack,
  );

  $app.append(root);
  renderCard();

  function renderCard(noAnimate = false) {
    if (cursor >= items.length) {
      stack.innerHTML = "";
      stack.append(h("div", { class: "q-done" },
        h("h1", {}, t("q_done_title")),
        h("p", { class: "muted" }, t("q_done_body")),
        h("div", { class: "form-actions" },
          h("button", { class: "btn btn-cats-back", onClick: () => navigate(`/q-categories/${profileId}/${resultId}`) }, "← " + t("btn_categories")),
          h("button", { class: "btn btn-primary", onClick: () => navigate(`/result/${resultId}`) }, t("btn_see_results")),
        ),
      ));
      return;
    }

    const cur = items[cursor];
    const peekNext = items[cursor + 1];
    stack.innerHTML = "";

    if (peekNext) stack.append(makeCard(peekNext, true));
    const card = makeCard(cur, false);
    stack.append(card);

    root.querySelector(".q-head")?.replaceWith(qHeader({
      profileId, resultId,
      idx: cursor, total: items.length, isItemBased: true,
      cat: cur.cat,
      progressPct: ((cursor + 1) / items.length) * 100,
      result, mode: "single",
    }));

    bindSwipe(card, {
      onLeft: () => advance(null, "left"),
      onRight: () => advance(null, "right"),
    });
    if (noAnimate) card.classList.add("in");
    else requestAnimationFrame(() => card.classList.add("in"));
  }

  function makeCard(it, isPeek) {
    const slot = result.answers?.[it.catId];
    const store = it.isCustom ? slot?.__custom : slot;
    const existing = store?.[it.item] || {};
    const itemScale = existing.itemScale || null;
    const activeScale = itemScale || SCALE;
    const sliderKey = itemScale
      ? findActiveItemScaleKey(existing.scale, itemScale, SCALE)
      : existing.scale;

    const answered = it.cat.gr
      ? !!(existing.giving || existing.receiving)
      : !!existing.scale;

    function applyGrKey(direction, key) {
      setStore(it, prev => {
        const n = { ...(prev || {}) };
        n[direction] = key;
        if (itemScale) n.itemScale = itemScale;
        return n;
      });
      renderCard(true);
    }

    const grGivingKey = itemScale
      ? findActiveItemScaleKey(existing.giving, itemScale, SCALE)
      : existing.giving;
    const grReceivingKey = itemScale
      ? findActiveItemScaleKey(existing.receiving, itemScale, SCALE)
      : existing.receiving;

    const _slang = getLang();
    const card = h("article", { class: "q-card" + (isPeek ? " is-peek" : ""), style: `--c:${it.cat.color}` },
      h("div", { class: "q-card-cat" },
        h("span", { class: "q-card-icon" }, it.cat.icon),
        h("span", {}, getCatTitle(it.cat, _slang)),
        it.isCustom ? h("span", { class: "q-item-tag" }, t("custom_tag")) : null,
        h("button", { class: "btn btn-ghost item-scale-btn", type: "button",
          onClick: async e => {
            e.stopPropagation();
            if (it.cat.gr ? (existing.giving || existing.receiving) : existing.scale) {
              if (!await dlgConfirm(t("item_scale_change_warning"), { okLabel: t("btn_ok") })) return;
            }
            const newItemScale = await editItemScaleDialog(itemScale || cloneScale(SCALE), SCALE);
            if (!newItemScale) return;
            setStore(it, prev => {
              const n = { ...(prev || {}) };
              n.itemScale = newItemScale.__clearAnswer ? newItemScale.scale : newItemScale;
              delete n.scale;
              delete n.giving;
              delete n.receiving;
              return n;
            });
            renderCard(true);
          }
        }, t("item_edit_scale")),
      ),
      h("h1", { class: "q-card-item" }, it.isCustom ? it.item : getItemLabel(it.cat, it.item, _slang)),
      it.cat.gr
        ? h("div", { class: "q-gr-sliders" },
            h("div", { class: "q-gr-row" },
              h("span", { class: "q-gr-label" }, t("lbl_giving")),
              scaleSliderEl({
                scale: activeScale,
                valueKey: grGivingKey,
                onChange: key => {
                  const rk = itemScale ? resolveAnswerKey(key, itemScale, SCALE) : key;
                  applyGrKey("giving", rk);
                },
                onClear: () => {
                  setStore(it, prev => { const n = { ...(prev || {}) }; delete n.giving; return n; });
                  renderCard(true);
                },
              }),
            ),
            h("div", { class: "q-gr-row" },
              h("span", { class: "q-gr-label" }, t("lbl_receiving")),
              scaleSliderEl({
                scale: activeScale,
                valueKey: grReceivingKey,
                onChange: key => {
                  const rk = itemScale ? resolveAnswerKey(key, itemScale, SCALE) : key;
                  applyGrKey("receiving", rk);
                },
                onClear: () => {
                  setStore(it, prev => { const n = { ...(prev || {}) }; delete n.receiving; return n; });
                  renderCard(true);
                },
              }),
            ),
          )
        : h("div", { class: "q-card-slider" },
            scaleSliderEl({
              scale: activeScale,
              valueKey: sliderKey,
              onChange: (key) => {
                const resultKey = itemScale ? resolveAnswerKey(key, itemScale, SCALE) : key;
                setStore(it, prev => ({ ...(prev || {}), scale: resultKey, ...(itemScale ? { itemScale } : {}) }));
                renderCard(true);
              },
              onClear: () => {
                setStore(it, prev => {
                  const c = { ...(prev || {}) };
                  delete c.scale;
                  return c;
                });
                renderCard(true);
              },
            })),
      h("input", {
        class: "q-card-note",
        type: "text",
        placeholder: t("note_placeholder"),
        value: existing.note || "",
        onChange: e => setNote(it, e.target.value),
      }),
      h("div", { class: "q-card-actions" },
        h("button", { class: "btn", onClick: () => advance(null, "back") }, t("btn_back")),
        h("button", {
          class: "btn btn-primary",
          onClick: () => advance(null, answered ? "right" : "left"),
        }, answered ? t("btn_next") : t("btn_skip")),
      ),
      h("div", { class: "q-card-progress" }, `${cursor + 1} / ${items.length}`),
    );
    return card;
  }
  function setNote(it, note) {
    setStore(it, prev => ({ ...(prev || { scale: "open" }), note }));
  }

  function setStore(it, mut) {
    result.answers = result.answers || {};
    result.answers[it.catId] = result.answers[it.catId] || {};
    if (it.isCustom) {
      result.answers[it.catId].__custom = result.answers[it.catId].__custom || {};
      result.answers[it.catId].__custom[it.item] = mut(result.answers[it.catId].__custom[it.item]);
    } else {
      result.answers[it.catId][it.item] = mut(result.answers[it.catId][it.item]);
    }
    Store.saveResult(result);
  }

  function advance(_scaleKey, dir) {
    if (dir === "back") {
      cursor = Math.max(0, cursor - 1);
    } else {
      cursor = Math.min(items.length, cursor + 1);
    }
    result.progress = result.progress || {};
    result.progress.flatIndex = cursor;
    Store.saveResult(result);
    const oldCard = stack.querySelector(".q-card:not(.is-peek)");
    if (oldCard) {
      oldCard.classList.add(dir === "left" ? "swipe-left" : dir === "right" ? "swipe-right" : "swipe-back");
      setTimeout(renderCard, 180);
    } else {
      renderCard();
    }
  }

  const onKey = (e) => {
    if (e.target.matches("input, textarea")) return;
    const n = parseInt(e.key, 10);
    if (!isNaN(n) && n >= 1 && n <= SCALE.length) {
      e.preventDefault();
      const cur = items[cursor];
      const key = SCALE[n - 1].key;
      setStore(cur, prev => ({ ...(prev || {}), scale: key }));
      renderCard();
      setTimeout(() => advance(null, "right"), 420);
    } else if (e.key === "ArrowRight" || e.key === "Enter") {
      e.preventDefault(); advance(null, "right");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault(); advance(null, "back");
    } else if (e.key === " ") {
      e.preventDefault(); advance(null, "left");
    }
  };
  document.addEventListener("keydown", onKey);
  const detach = () => { document.removeEventListener("keydown", onKey); window.removeEventListener("hashchange", detach); };
  window.addEventListener("hashchange", detach);
}

function bindSwipe(el, { onLeft, onRight, threshold = 80 } = {}) {
  let startX = null, startY = null, dx = 0, dy = 0, dragging = false;
  const start = e => {
    const tch = e.touches ? e.touches[0] : e;
    if (!tch) return;
    if (e.target.closest("button, input, textarea, .scale-pill")) return;
    startX = tch.clientX; startY = tch.clientY; dx = 0; dy = 0; dragging = true;
    el.classList.add("dragging");
  };
  const move = e => {
    if (!dragging) return;
    const tch = e.touches ? e.touches[0] : e;
    if (!tch) return;
    dx = tch.clientX - startX;
    dy = tch.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dy) > 30) return;
    el.style.transform = `translate(${dx}px, ${dy * 0.2}px) rotate(${dx * 0.04}deg)`;
    el.style.opacity = String(1 - Math.min(0.5, Math.abs(dx) / 600));
  };
  const end = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("dragging");
    el.style.transform = "";
    el.style.opacity = "";
    if (dx <= -threshold) onLeft?.();
    else if (dx >= threshold) onRight?.();
  };
  el.addEventListener("touchstart", start, { passive: true });
  el.addEventListener("touchmove", move, { passive: true });
  el.addEventListener("touchend", end);
  el.addEventListener("mousedown", start);
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
}

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

function showKeyboardHelpDialog(mode = "list") {
  const row = (k, txt) => h("div", { class: "kbd-row" },
    h("kbd", { class: "kbd" }, k), h("span", {}, txt));
  return dialog({
    title: t("kbd_title"),
    body: h("div", { class: "kbd-help" },
      h("p", { class: "muted small" }, t("kbd_sub")),
      mode === "single" ? h("div", { class: "kbd-section" },
        h("h3", {}, t("kbd_single_title")),
        row("1 – 9", t("kbd_rate")),
        row("→  /  Enter", t("kbd_skip_next")),
        row("←", t("kbd_prev")),
        row("Space", t("kbd_skip")),
      ) : h("div", { class: "kbd-section" },
        h("h3", {}, t("kbd_list_title")),
        row("Tab", t("kbd_tab")),
        row("1 – 9", t("kbd_rate_list")),
        row("0", t("kbd_clear")),
        row("Enter  /  ↓", t("kbd_next_item")),
        row("↑", t("kbd_prev_item")),
      ),
      h("div", { class: "kbd-section" },
        h("h3", {}, t("kbd_slider_title")),
        row("← / →", t("kbd_step")),
        row("Home / End", t("kbd_bounds")),
        row("Backspace", t("kbd_clear_rating")),
      )),
    actions: [{ label: t("btn_got_it"), kind: "primary", primary: true, value: true }],
  });
}

// ---------- Result view ----------
function viewResult(resultId) {
  const r = Store.getResult(resultId);
  if (!r) return navigate("/");
  const profile = Store.getProfile(r.profileId);

  const dataset = {
    name: resultLabel(r, profile),
    color: r.subjectColor || profile.color,
    answers: r.answers || {},
    scale: getResultScale(r),
  };

  $app.append(h("section", { class: "page" },
    h("header", { class: "result-head", style: `--c:${dataset.color}` },
      h("button", { class: "btn btn-ghost", onClick: () => navigate(`/profile/${profile.id}`) }, t("btn_back")),
      h("div", { class: "li-avatar" }, r.subjectEmoji || "💞"),
      h("div", {},
        h("h1", {}, r.subject + (r.version > 1 ? ` (v${r.version})` : "")),
        h("p", { class: "muted" }, `${profile.emoji} ${profile.name} · ${countAnswers(r)} ${t("answers")} · ${t("result_last_edited")} ${fmtDate(r.updatedAt)}`)),
      h("div", { class: "flex-spacer" }),
      h("button", { class: "btn", onClick: () => navigate(`/map/${r.id}/settings`) }, t("btn_map_settings")),
      h("button", { class: "btn", onClick: () => navigate(`/q/${profile.id}/${r.id}`) }, t("btn_continue_editing")),
      h("button", { class: "btn btn-primary", onClick: () => navigate(`/share/${r.id}`) }, t("btn_share")),
    ),

    Store.getFabiMode() ? h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("result_category_overview")),
        h("p", { class: "muted" }, t("result_category_overview_sub"))),
      h("div", { class: "panel rs-chart-clickable", title: t("enlarge_chart"),
        onClick: () => openEnlargedSpiderModal([dataset]),
        html: renderSpider([dataset], { size: 540 }) })) : null,

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("compare_with"))),
      h("div", { class: "compare-pickers" },
        compareTargetPicker(profile.id, r.id))),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("by_category")),
        h("p", { class: "muted" }, t("by_category_sub")),
        r.enabledCategories ? h("button", { class: "btn", onClick: () => openAddCategoriesDialog(r.profileId, r.id) }, t("btn_add_categories")) : null),
      h("div", { class: "cat-grid" }, ...categoryCards([dataset], r))),
  ));
}

// ---------- Enlarged spider modal (for Compare / Result overview) ----------
function openEnlargedSpiderModal(datasets) {
  return dialog({
    title: t("chart_modal_title"),
    body: () => {
      const wrap = h("div", { class: "enlarged-spider-wrap" },
        h("div", { html: renderSpider(datasets, { size: 680 }) })
      );
      requestAnimationFrame(() => bindSpiderInteractivity(wrap));
      return wrap;
    },
    actions: [{ label: t("btn_close"), kind: "ghost", value: null, primary: true }],
  });
}

// ---------- Category cards ----------
function categoryCards(datasets, editableResult = null) {
  const fabiMode = Store.getFabiMode();
  const _cclang = getLang();
  const enabledIds = editableResult?.enabledCategories;
  const displayCats = enabledIds ? CATEGORIES.filter(c => enabledIds.includes(c.id)) : CATEGORIES;
  return displayCats.map(cat => {
    const filledCount = datasets.reduce((acc, d) => {
      const slot = d.answers?.[cat.id] || {};
      let n = 0;
      for (const [k, v] of Object.entries(slot)) {
        if (k === "__custom") n += Object.keys(v || {}).length;
        else if (v?.scale) n++;
      }
      return acc + n;
    }, 0);

    const card = h("button", {
      class: "cat-card cat-card-btn",
      style: `--c:${cat.color}`,
      type: "button",
      onClick: () => openCategoryModal(datasets, cat, editableResult),
    },
      h("div", { class: "cat-card-head" },
        h("div", { class: "cat-card-icon" }, cat.icon),
        h("div", { class: "cat-card-titles" },
          h("h3", {}, getCatTitle(cat, _cclang)),
          h("p", { class: "muted small" }, _cclang === "de" && cat.deBlurb ? cat.deBlurb : cat.blurb)),
        fabiMode ? h("div", { class: "cat-card-summary", html: summaryCellsHTML(datasets, cat.id) }) : null,
        h("span", { class: "cat-card-toggle", "aria-hidden": "true" }, "→"),
      ),
    );
    if (filledCount === 0) card.classList.add("is-empty");
    return card;
  });
}

// ---------- Category modal with tabs (Spider | Item-by-Item | Edit) ----------
function openCategoryModal(datasets, cat, editableResult = null) {
  const _modlang = getLang();
  // Deep-clone answers for local editing so we can diff on close
  let localAnswers = editableResult
    ? JSON.parse(JSON.stringify(editableResult.answers || {}))
    : null;
  let hasChanges = false;

  const tabs = [
    { id: "spider", label: t("tab_spider") },
    { id: "items",  label: t("tab_items") },
    ...(editableResult ? [{ id: "edit", label: t("tab_edit") }] : []),
  ];
  let activeTab = "spider";

  return new Promise(resolve => {
    const overlay = h("div", { class: "rs-modal-overlay cat-modal-overlay", role: "dialog", "aria-modal": "true" });
    const card = h("div", { class: "rs-modal-card cat-modal-wrap" });

    const close = async (save = false) => {
      if (hasChanges && !save) {
        const discard = await dlgConfirm(t("confirm_discard_changes"), {
          okLabel: t("btn_discard"),
          danger: true,
        });
        if (!discard) return; // stay open
      }
      if (save && editableResult && hasChanges) {
        editableResult.answers = localAnswers;
        Store.saveResult(editableResult);
        showToast(t("btn_save_changes") + " ✔");
      }
      overlay.classList.add("closing");
      setTimeout(() => overlay.remove(), 160);
      document.removeEventListener("keydown", escKey);
      resolve();
    };

    const escKey = (e) => { if (e.key === "Escape") close(false); };
    document.addEventListener("keydown", escKey);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(false); });

    function renderTab() {
      card.innerHTML = "";

      // Header
      card.append(h("div", { class: "cat-modal-head-row" },
        h("div", { class: "cat-modal-icon-wrap" },
          h("span", { class: "cat-modal-icon" }, cat.icon),
          h("div", {},
            h("h2", { class: "cat-modal-title" }, getCatTitle(cat, _modlang)),
            h("p", { class: "muted small" }, _modlang === "de" && cat.deBlurb ? cat.deBlurb : cat.blurb),
          ),
        ),
      ));

      // Tab bar
      const tabBar = h("div", { class: "cat-modal-tabs" },
        ...tabs.map(tab => h("button", {
          class: "cat-modal-tab" + (activeTab === tab.id ? " active" : ""),
          type: "button",
          onClick: () => { activeTab = tab.id; renderTab(); },
        }, tab.label))
      );
      card.append(tabBar);

      // Tab content
      const content = h("div", { class: "cat-modal-content" });

      if (activeTab === "spider") {
        const datasetsForModal = editableResult
          ? [{ ...datasets[0], answers: localAnswers }]
          : datasets;
        const spiderWrap = h("div", { class: "cat-modal-spider", html: renderItemSpider(datasetsForModal, cat.id, { size: 520 }) });
        requestAnimationFrame(() => bindSpiderInteractivity(spiderWrap));
        content.append(spiderWrap);

      } else if (activeTab === "items") {
        const datasetsForModal = editableResult
          ? [{ ...datasets[0], answers: localAnswers }]
          : datasets;
        content.append(h("div", { class: "cat-modal-bars-scroll" },
          h("div", { html: renderCategoryBars(datasetsForModal, cat.id) })
        ));

      } else if (activeTab === "edit" && editableResult) {
        content.append(renderEditTab(cat, editableResult, localAnswers, () => { hasChanges = true; }));
      }

      card.append(content);

      // Actions
      const actionRow = h("div", { class: "rs-modal-actions" });
      if (editableResult && hasChanges) {
        actionRow.append(
          h("button", { class: "btn btn-ghost", onClick: () => close(false) }, t("btn_discard")),
          h("button", { class: "btn btn-primary", onClick: () => close(true) }, t("btn_save_changes")),
        );
      } else {
        actionRow.append(h("button", { class: "btn btn-ghost", onClick: () => close(false) }, t("btn_close")));
      }
      card.append(actionRow);
    }

    renderTab();
    overlay.append(card);
    document.body.append(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));
  });
}

// Renders the editable items tab inside the category modal
function renderEditTab(cat, result, localAnswers, onChanged) {
  const _etlang = getLang();
  const SCALE = getResultScale(result);
  localAnswers[cat.id] = localAnswers[cat.id] || {};
  const catAnswers = localAnswers[cat.id];
  catAnswers.__custom = catAnswers.__custom || {};

  const asked = askedItemsForCat(result, cat.id);
  const baseItems = asked ? asked.base : cat.items;
  const customNames = asked
    ? Array.from(new Set([...(asked.custom || []), ...Object.keys(catAnswers.__custom)]))
    : Object.keys(catAnswers.__custom);

  const container = h("div", { class: "modal-edit-items" });

  function rerender() {
    container.innerHTML = "";
    const items = [
      ...baseItems.map(name => ({ name, isCustom: false })),
      ...customNames.map(name => ({ name, isCustom: true })),
    ];

    items.forEach(({ name, isCustom }) => {
      const store = isCustom ? catAnswers.__custom : catAnswers;
      const existing = store[name] || {};
      const itemScale = existing.itemScale || null;
      const activeScale = itemScale || SCALE;
      const sliderKey = itemScale
        ? findActiveItemScaleKey(existing.scale, itemScale, SCALE)
        : existing.scale;

      const grAnswered = cat.gr ? !!(existing.giving || existing.receiving) : false;
      const answered = cat.gr ? grAnswered : !!existing.scale;
      const grGivingKey = itemScale
        ? findActiveItemScaleKey(existing.giving, itemScale, SCALE)
        : existing.giving;
      const grReceivingKey = itemScale
        ? findActiveItemScaleKey(existing.receiving, itemScale, SCALE)
        : existing.receiving;

      const row = h("div", { class: "q-item modal-edit-item" + (answered ? " is-answered" : "") },
        h("div", { class: "q-item-name" },
          isCustom ? h("span", { class: "q-item-tag" }, t("custom_tag")) : null,
          isCustom ? name : getItemLabel(cat, name, _etlang),
          h("button", { class: "btn btn-ghost item-scale-btn", type: "button",
            onClick: async e => {
              e.stopPropagation();
              if (cat.gr ? (existing.giving || existing.receiving) : existing.scale) {
                if (!await dlgConfirm(t("item_scale_change_warning"), { okLabel: t("btn_ok") })) return;
              }
              const newItemScale = await editItemScaleDialog(itemScale || cloneScale(SCALE), SCALE);
              if (!newItemScale) return;
              store[name] = { ...(store[name] || {}), itemScale: newItemScale };
              delete store[name].scale;
              delete store[name].giving;
              delete store[name].receiving;
              onChanged();
              rerender();
            }
          }, t("item_edit_scale")),
        ),
        cat.gr
          ? h("div", { class: "q-gr-sliders" },
              h("div", { class: "q-gr-row" },
                h("span", { class: "q-gr-label" }, t("lbl_giving")),
                scaleSliderEl({
                  scale: activeScale,
                  valueKey: grGivingKey,
                  onChange: key => {
                    const rk = itemScale ? resolveAnswerKey(key, itemScale, SCALE) : key;
                    store[name] = { ...(store[name] || {}), giving: rk };
                    if (itemScale) store[name].itemScale = itemScale;
                    onChanged();
                    rerender();
                  },
                  onClear: () => {
                    if (store[name]) delete store[name].giving;
                    onChanged();
                    rerender();
                  },
                }),
              ),
              h("div", { class: "q-gr-row" },
                h("span", { class: "q-gr-label" }, t("lbl_receiving")),
                scaleSliderEl({
                  scale: activeScale,
                  valueKey: grReceivingKey,
                  onChange: key => {
                    const rk = itemScale ? resolveAnswerKey(key, itemScale, SCALE) : key;
                    store[name] = { ...(store[name] || {}), receiving: rk };
                    if (itemScale) store[name].itemScale = itemScale;
                    onChanged();
                    rerender();
                  },
                  onClear: () => {
                    if (store[name]) delete store[name].receiving;
                    onChanged();
                    rerender();
                  },
                }),
              ),
            )
          : h("div", { class: "q-slider-wrap" },
              scaleSliderEl({
                scale: activeScale,
                valueKey: sliderKey,
                onChange: (key) => {
                  const resultKey = itemScale ? resolveAnswerKey(key, itemScale, SCALE) : key;
                  store[name] = { ...(store[name] || {}), scale: resultKey };
                  if (itemScale) store[name].itemScale = itemScale;
                  onChanged();
                  rerender();
                },
                onClear: () => {
                  delete store[name];
                  onChanged();
                  rerender();
                },
              })
            ),
        h("input", {
          class: "q-note",
          type: "text",
          placeholder: t("note_placeholder"),
          value: existing.note || "",
          onChange: e => {
            store[name] = { ...(store[name] || { scale: "open" }), note: e.target.value };
            onChanged();
          }
        }),
      );
      container.append(row);
    });

    // Add custom item
    container.append(h("button", { class: "q-add", onClick: async () => {
      const newName = await dlgPrompt({
        title: t("add_custom_title"),
        label: t("add_custom_label"),
        placeholder: t("add_custom_placeholder"),
        okLabel: t("btn_add"),
      });
      if (!newName) return;
      if (cat.items.includes(newName) || catAnswers.__custom[newName]) {
        return showToast(t("item_already_exists"));
      }
      catAnswers.__custom[newName] = {};
      customNames.push(newName);
      onChanged();
      rerender();
    }}, t("btn_add_custom")));
  }

  rerender();
  return container;
}

function summaryCellsHTML(datasets, catId) {
  return datasets.map(ds => {
    const v = categoryAverage(ds.answers, catId);
    if (v === null) return `<span class="cell muted">—</span>`;
    const sc = closestScale(v);
    return `<span class="cell" style="background:${sc.color}33; color:${sc.color}; border-color:${sc.color}55">${esc(sc.short)}</span>`;
  }).join("");
}

function closestScale(value) {
  const SCALE = Store.getScale();
  let best = SCALE[0], d = Infinity;
  for (const s of SCALE) {
    const dd = Math.abs(s.value - value);
    if (dd < d) { d = dd; best = s; }
  }
  return best;
}

function compareTargetPicker(profileId, currentResultId) {
  const others = Store.getResults().filter(x => x.id !== currentResultId);
  const imports = Store.getImports();
  if (!others.length && !imports.length) {
    return h("p", { class: "muted" }, t("no_compare"));
  }
  const tile = (cfg) => h("button", {
    class: "compare-tile",
    style: `--c:${cfg.color}`,
    onClick: () => navigate(`/compare?ids=${currentResultId},${cfg.id}`),
  },
    h("div", { class: "li-avatar" }, cfg.emoji),
    h("div", { class: "compare-tile-body" },
      h("h3", {}, cfg.title),
      h("p", { class: "muted small" }, cfg.sub)),
    h("span", { class: "compare-tile-arrow" }, "→"),
  );

  const sections = [];

  if (others.length) {
    sections.push(
      h("div", { class: "compare-section" },
        h("h3", { class: "compare-section-title" }, t("compare_own_maps")),
        h("div", { class: "compare-grid" },
          ...others.map(o => {
            const op = Store.getProfile(o.profileId);
            return tile({
              id: o.id,
              emoji: o.subjectEmoji || op?.emoji || "💞",
              color: o.subjectColor || op?.color,
              title: `${op?.name || "?"} → ${o.subject}`,
              sub: `${t("updated")} ${fmtDate(o.updatedAt)}`,
            });
          }),
        ),
      )
    );
  }

  sections.push(
    h("div", { class: "compare-section" },
      h("h3", { class: "compare-section-title" }, t("compare_imports_title")),
      h("div", { class: "compare-grid" },
        ...imports.map(i => tile({
          id: "imp:" + i.id,
          emoji: i.emoji || "📨",
          color: i.color || "#7c3aed",
          title: `${i.name} → ${i.subject}`,
          sub: `${t("imported_on")} ${fmtDate(i.importedAt)}`,
        })),
        h("button", {
          class: "compare-tile compare-tile-import",
          style: "--c:#7c3aed",
          onClick: () => navigate("/import"),
        },
          h("div", { class: "li-avatar" }, "📥"),
          h("div", { class: "compare-tile-body" },
            h("h3", {}, t("btn_import_map")),
            h("p", { class: "muted small" }, "")),
          h("span", { class: "compare-tile-arrow" }, "→"),
        ),
      ),
    )
  );

  return h("div", { class: "compare-pickers-split" }, ...sections);
}

// ---------- Share ----------
function viewShare(resultId) {
  const r = Store.getResult(resultId);
  if (!r) return navigate("/");
  const profile = Store.getProfile(r.profileId);

  const payload = {
    type: "relationshape-result",
    name: profile.name,
    pronouns: profile.pronouns,
    emoji: profile.emoji,
    color: profile.color,
    subject: r.subject,
    subjectEmoji: r.subjectEmoji,
    subjectColor: r.subjectColor,
    answers: r.answers,
    scale: getResultScale(r),
    enabledCategories: r.enabledCategories || null,
    askedItems: r.askedItems || null,
    version: r.version || 1,
    sharedAt: Date.now(),
  };

  const output = h("textarea", { class: "share-out", readonly: "", rows: 12 });
  const out = h("div", { class: "share-result", style: "display:none" },
    h("h2", {}, t("share_bundle_title")),
    h("p", { class: "muted" }, t("share_bundle_sub")),
    output,
    h("div", { class: "form-actions" },
      h("button", { class: "btn", onClick: async () => {
        await navigator.clipboard.writeText(output.value); showToast(t("btn_copy") + " ✔");
      }}, t("btn_copy")),
      h("button", { class: "btn", onClick: () => {
        const blob = new Blob([output.value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relationshape-${slug(profile.name)}-${slug(r.subject)}.rshape.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }}, t("btn_download"))),
  );

  const root = h("section", { class: "page narrow" },
    h("button", { class: "btn btn-ghost", onClick: () => navigate(`/result/${resultId}`) }, t("btn_back")),
    h("h1", {}, t("share_title")),
    h("p", {}, t("share_intro")),
    h("div", { class: "callout" },
      h("strong", {}, t("share_callout_title")), " ", t("share_callout_body")),

    h("form", { class: "form", onSubmit: async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const pass = fd.get("pass");
      const passConfirm = fd.get("passConfirm");
      if (pass.length < 6) return dlgAlert(t("pass_too_short"));
      if (pass !== passConfirm) return dlgAlert(t("pass_mismatch"));
      const blob = await encryptResult(payload, pass);
      output.value = blob;
      out.style.display = "block";
      out.scrollIntoView({ behavior: "smooth" });
    }},
      h("label", {}, t("share_pass_label"),
        h("input", { name: "pass", type: "password", autocomplete: "new-password", required: true, minlength: 6 })),
      h("label", {}, t("share_pass_confirm_label"),
        h("input", { name: "passConfirm", type: "password", autocomplete: "new-password", required: true })),
      h("div", { class: "form-actions" },
        h("button", { class: "btn btn-primary", type: "submit" }, t("btn_encrypt"))),
    ),
    out,
  );

  $app.append(root);
}

function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24); }

// ---------- Import ----------
function viewImport() {
  const root = h("section", { class: "page narrow" },
    h("h1", {}, t("import_title")),
    h("p", {}, t("import_intro"), " ", h("code", {}, ".rshape.txt"), " ", t("import_intro2")),

    h("form", { class: "form", onSubmit: async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const blob = (fd.get("blob") || "").toString().trim();
      const pass = (fd.get("pass") || "").toString();
      if (!blob) return dlgAlert(t("import_empty"));
      try {
        const payload = await decryptResult(blob, pass);
        if (payload.type !== "relationshape-result") throw new Error(t("import_wrong_type"));
        const version = Store.nextImportVersion(payload.name, payload.subject);
        const imp = Store.saveImport({
          name: payload.name, pronouns: payload.pronouns,
          emoji: payload.emoji, color: payload.color,
          subject: payload.subject, subjectEmoji: payload.subjectEmoji,
          subjectColor: payload.subjectColor, answers: payload.answers,
          scale: payload.scale,
          enabledCategories: payload.enabledCategories || null,
          askedItems: payload.askedItems || null,
          version,
          srcVersion: payload.version || 1,
        });
        showToast(version > 1 ? t("imported_versioned_toast", { n: version }) : t("imported_toast"));
        navigate(`/compare?ids=imp:${imp.id}`);
      } catch (err) {
        dlgAlert(err.message || "Could not decrypt.", t("import_failed_title"));
      }
    }},
      h("label", {}, t("import_bundle_label"),
        h("textarea", { name: "blob", rows: 10, placeholder: "-----BEGIN RELATIONSHAPE BUNDLE-----\nv1\n…\n-----END RELATIONSHAPE BUNDLE-----" })),
      h("label", {}, t("import_file_label"),
        h("input", { type: "file", accept: ".txt,.rshape,.json", onChange: e => {
          const f = e.target.files[0]; if (!f) return;
          const reader = new FileReader();
          reader.onload = () => { document.querySelector("[name=blob]").value = reader.result; };
          reader.readAsText(f);
        }})),
      h("label", {}, t("import_pass_label"),
        h("input", { name: "pass", type: "password", autocomplete: "off", required: true })),
      h("div", { class: "form-actions" },
        h("button", { class: "btn btn-primary", type: "submit" }, t("btn_decrypt"))),
    )
  );
  $app.append(root);
}

// ---------- Compare ----------
function viewCompare(ids) {
  const profiles = Store.getProfiles();
  const results = Store.getResults();
  const imports = Store.getImports();

  const allOptions = [
    ...results.map(r => ({
      id: r.id,
      label: resultLabel(r, profiles.find(p => p.id === r.profileId)),
      color: r.subjectColor,
      emoji: r.subjectEmoji,
      answers: r.answers,
      scale: r.scale,
      kind: "result"
    })),
    ...imports.map(i => ({
      id: "imp:" + i.id,
      label: importLabel(i),
      color: i.color || "#7c3aed",
      emoji: i.emoji || "📨",
      answers: i.answers,
      scale: i.scale,
      kind: "import"
    })),
  ];

  let selected = ids.map(id => allOptions.find(o => o.id === id)).filter(Boolean);
  if (!selected.length) selected = allOptions.slice(0, 2);

  const datasets = selected.map(s => ({ name: s.label, color: s.color, answers: s.answers, scale: s.scale }));

  const root = h("section", { class: "page" },
    h("header", { class: "page-head" },
      h("h1", {}, t("compare_title")),
      h("p", { class: "muted" }, t("compare_sub"))),

    h("div", { class: "compare-pick" },
      ...allOptions.map(o => {
        const isOn = selected.some(s => s.id === o.id);
        return h("button", {
          class: "pick-chip" + (isOn ? " on" : ""),
          style: `--c:${o.color}`,
          onClick: () => {
            const next = isOn ? selected.filter(s => s.id !== o.id) : [...selected, o].slice(0, 4);
            navigate("/compare?ids=" + next.map(s => s.id).join(","));
          }
        }, h("span", { class: "swatch" }), o.emoji + " " + o.label);
      })
    ),

    selected.length === 0
      ? h("div", { class: "callout" }, t("compare_select"))
      : (Store.getFabiMode()
          ? h("div", { class: "panel rs-chart-clickable", title: t("enlarge_chart"),
              onClick: () => openEnlargedSpiderModal(datasets),
              html: renderSpider(datasets, { size: 560 }) })
          : h("div", { class: "callout muted small" },
              getLang() === "de"
                ? "Tipp: Aktiviere den \u201eFabi-Modus\u201c in den Einstellungen f\u00fcr ein \u00dcbersichts-Spinnendiagramm. W\u00e4hle unten eine Kategorie f\u00fcr einen detaillierten Item-Vergleich."
                : "Tip: Enable \u201cFabi mode\u201d in Settings to see a category overviews spider chart here. Or pick a category below to compare item by item.")),

    selected.length >= 2 ? h("section", { class: "page-section" },
      h("header", { class: "section-head" }, h("h2", {}, t("alignment_title"))),
      h("div", { class: "panel", html: renderAlignment(datasets) })
    ) : null,

    selected.length >= 1 ? h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("cat_details_title")),
        h("p", { class: "muted" }, t("cat_details_sub"))),
      h("div", { class: "cat-grid" }, ...categoryCards(datasets, null))
    ) : null,
  );
  $app.append(root);
}

// ---------- Settings ----------
function viewSettings() {
  const SCALE = Store.getScale();

  const list = h("div", { class: "scale-editor" });

  function rerender() {
    const fresh = Store.getScale();
    list.innerHTML = "";
    fresh.forEach((s, i) => {
      const row = h("div", { class: "scale-row", style: `--c:${s.color}` },
        h("div", { class: "scale-row-rank" }, `${fresh.length - i}`),
        h("input", { class: "scale-row-color", type: "color", value: s.color, onInput: (e) => {
          fresh[i].color = e.target.value; Store.setScale(fresh);
        }}),
        h("input", { class: "scale-row-label", type: "text", value: s.label, placeholder: t("scale_step_label"),
          onChange: (e) => { fresh[i].label = e.target.value || s.label; Store.setScale(fresh); }
        }),
        h("input", { class: "scale-row-short", type: "text", value: s.short, maxlength: 24, placeholder: t("scale_step_short"),
          onChange: (e) => { fresh[i].short = (e.target.value || s.short).slice(0, 24); Store.setScale(fresh); }
        }),
        h("input", { class: "scale-row-desc", type: "text", value: s.description || "", placeholder: t("scale_step_desc"),
          onChange: (e) => { fresh[i].description = e.target.value; Store.setScale(fresh); }
        }),
        h("div", { class: "scale-row-actions" },
          h("button", { class: "icon-btn", title: "Move up", disabled: i === 0,
            onClick: () => { swap(fresh, i, i - 1); Store.setScale(fresh); rerender(); } }, "↑"),
          h("button", { class: "icon-btn", title: "Move down", disabled: i === fresh.length - 1,
            onClick: () => { swap(fresh, i, i + 1); Store.setScale(fresh); rerender(); } }, "↓"),
          h("button", { class: "icon-btn danger", title: "Remove", disabled: fresh.length <= 2,
            onClick: async () => {
              if (Store.scaleHasData(s.key)) {
                if (!await dlgConfirm(t("scale_step_remove_confirm", { label: s.label }), { danger: true, okLabel: t("btn_delete") })) return;
              }
              fresh.splice(i, 1);
              Store.setScale(fresh);
              if (Store.scaleHasData(s.key)) clearScaleKey(s.key);
              rerender();
            }
          }, "🗑"),
        )
      );
      list.append(row);
    });
  }

  function swap(arr, a, b) { const tmp = arr[a]; arr[a] = arr[b]; arr[b] = tmp; }

  function clearScaleKey(key) {
    const data = Store.exportAll();
    function scrub(answers) {
      for (const cat of Object.values(answers || {})) {
        for (const k of Object.keys(cat)) {
          if (k === "__custom") {
            for (const c of Object.keys(cat.__custom)) {
              if (cat.__custom[c]?.scale === key) delete cat.__custom[c];
            }
          } else if (cat[k]?.scale === key) {
            delete cat[k];
          }
        }
      }
    }
    for (const r of data.results) scrub(r.answers);
    for (const imp of data.imports) scrub(imp.answers);
    localStorage.setItem("relationshape.v1", JSON.stringify(data));
  }

  rerender();

  const theme = Store.getTheme();
  const themeRow = h("div", { class: "theme-picker" },
    ...[
      { v: "auto",  label: t("theme_auto") },
      { v: "light", label: t("theme_light") },
      { v: "dark",  label: t("theme_dark") },
    ].map(opt => h("button", {
      class: "theme-pick" + (theme === opt.v ? " is-on" : ""),
      type: "button",
      onClick: () => { applyTheme(opt.v); route(); },
    }, opt.label))
  );

  // Language picker
  const currentLang = getLang();
  const langRow = h("div", { class: "theme-picker" },
    ...availableLangs().map(lang => h("button", {
      class: "theme-pick" + (currentLang === lang.code ? " is-on" : ""),
      type: "button",
      onClick: () => { setLang(lang.code); bindGlobalNav(); route(); },
    }, lang.label))
  );

  $app.append(h("section", { class: "page narrow" },
    h("h1", {}, t("settings_title")),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("settings_appearance"))),
      themeRow,
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("lang_label"))),
      langRow,
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("settings_display_modes"))),
      h("div", { class: "onboard-toggles" },
        (() => {
          const fabi = Store.getFabiMode();
          const row = h("button", {
            class: "onboard-toggle" + (fabi ? " is-on" : ""),
            type: "button",
            onClick: () => {
              const next = !Store.getFabiMode();
              Store.setFabiMode(next);
              row.classList.toggle("is-on", next);
              row.querySelector(".onboard-switch").classList.toggle("on", next);
            },
          },
            h("div", { class: "onboard-text" },
              h("strong", {}, t("fabi_mode_title")),
              h("p", { class: "muted small" }, t("fabi_mode_desc"))),
            h("div", { class: "onboard-switch" + (fabi ? " on" : "") }),
          );
          return row;
        })()),
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("settings_scale_title")),
        h("p", { class: "muted" }, t("settings_scale_sub"))),
      h("div", { class: "scale-legend-header" },
        h("span", {}),
        h("span", {}, t("scale_col_color")),
        h("span", {}, t("scale_col_label")),
        h("span", {}, t("scale_col_short")),
        h("span", {}),
      ),
      list,
      h("div", { class: "form-actions" },
        h("button", { class: "btn", onClick: () => {
          const sc = Store.getScale();
          const newKey = "step-" + Date.now().toString(36);
          const fresh = [...sc, {
            key: newKey, label: t("scale_step_new"), short: t("scale_step_new"),
            color: pickColor(), description: "",
          }];
          Store.setScale(fresh); rerender();
        }}, t("btn_add_step")),
        h("button", { class: "btn btn-ghost", onClick: async () => {
          if (await dlgConfirm(t("confirm_reset_scale"))) {
            Store.resetScale(); rerender();
          }
        }}, t("btn_reset_defaults")))
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" }, h("h2", {}, t("settings_data"))),
      h("div", { class: "form-actions" },
        h("button", { class: "btn", onClick: () => {
          const data = Store.exportAll();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "relationshape-backup.json";
          a.click(); URL.revokeObjectURL(url);
        }}, t("btn_backup")),
        h("button", { class: "btn", onClick: () => promptRestoreBackup() }, t("btn_restore")),
        h("button", { class: "btn btn-danger-ghost", onClick: async () => {
          if (await dlgConfirm(t("confirm_erase"), { danger: true, okLabel: t("btn_erase") })) {
            Store.wipe(); navigate("/");
          }
        }}, t("btn_erase")))
    ),
  ));
}

async function promptRestoreBackup() {
  const input = h("input", { type: "file", accept: ".json,application/json" });
  const choice = await dialog({
    title: t("restore_title"),
    body: () => h("div", { class: "form" },
      h("p", { class: "muted small" }, t("restore_warning")),
      h("label", {}, t("restore_file_label"), input),
    ),
    actions: [
      { label: t("btn_cancel"), kind: "ghost", value: null },
      { label: t("btn_replace_all"), kind: "danger", primary: true,
        handler: async () => {
          const f = input.files?.[0];
          if (!f) { showToast(t("restore_pick_file")); return false; }
          const text = await f.text();
          let parsed;
          try { parsed = JSON.parse(text); }
          catch { showToast(t("restore_invalid")); return false; }
          try { Store.replaceAll(parsed); }
          catch (e) { showToast(e.message); return false; }
          return true;
        }
      },
    ],
  });
  if (choice) { applyTheme(); showToast(t("restore_done")); navigate("/"); }
}

// ---------- Per-map settings ----------
function viewMapSettings(resultId) {
  const r = Store.getResult(resultId);
  if (!r) return navigate("/");
  const profile = Store.getProfile(r.profileId);
  r.scale = r.scale || cloneScale(Store.getScale());
  r.enabledCategories = r.enabledCategories || CATEGORIES.map(c => c.id);

  const list = h("div", { class: "scale-editor" });
  function rerenderScale() {
    const fresh = r.scale;
    list.innerHTML = "";
    fresh.forEach((s, i) => {
      const row = h("div", { class: "scale-row", style: `--c:${s.color}` },
        h("div", { class: "scale-row-rank" }, `${fresh.length - i}`),
        h("input", { class: "scale-row-color", type: "color", value: s.color, onInput: (e) => {
          fresh[i].color = e.target.value; Store.setResultScale(r.id, fresh);
        }}),
        h("input", { class: "scale-row-label", type: "text", value: s.label, placeholder: t("scale_step_label"),
          onChange: (e) => { fresh[i].label = e.target.value || s.label; Store.setResultScale(r.id, fresh); }
        }),
        h("input", { class: "scale-row-short", type: "text", value: s.short, maxlength: 24, placeholder: t("scale_step_short"),
          onChange: (e) => { fresh[i].short = (e.target.value || s.short).slice(0, 24); Store.setResultScale(r.id, fresh); }
        }),
        h("input", { class: "scale-row-desc", type: "text", value: s.description || "", placeholder: t("scale_step_desc"),
          onChange: (e) => { fresh[i].description = e.target.value; Store.setResultScale(r.id, fresh); }
        }),
        h("div", { class: "scale-row-actions" },
          h("button", { class: "icon-btn", title: "Move up", disabled: i === 0,
            onClick: () => { const tmp = fresh[i]; fresh[i] = fresh[i-1]; fresh[i-1] = tmp; Store.setResultScale(r.id, fresh); rerenderScale(); } }, "↑"),
          h("button", { class: "icon-btn", title: "Move down", disabled: i === fresh.length - 1,
            onClick: () => { const tmp = fresh[i]; fresh[i] = fresh[i+1]; fresh[i+1] = tmp; Store.setResultScale(r.id, fresh); rerenderScale(); } }, "↓"),
          h("button", { class: "icon-btn danger", title: "Remove", disabled: fresh.length <= 2,
            onClick: () => { fresh.splice(i, 1); Store.setResultScale(r.id, fresh); rerenderScale(); } }, "🗑"),
        )
      );
      list.append(row);
    });
  }
  rerenderScale();

  const _mslang = getLang();
  const catGrid = h("div", { class: "cat-toggle-grid" });
  function renderCats() {
    catGrid.innerHTML = "";
    CATEGORIES.forEach(cat => {
      const enabled = r.enabledCategories.includes(cat.id);
      const tile = h("button", {
        class: "cat-toggle" + (enabled ? " is-on" : ""),
        style: `--c:${cat.color}`,
        type: "button",
        onClick: () => {
          if (enabled) r.enabledCategories = r.enabledCategories.filter(c => c !== cat.id);
          else r.enabledCategories = [...r.enabledCategories, cat.id];
          Store.saveResult(r);
          renderCats();
        },
      },
        h("span", { class: "cat-toggle-icon" }, cat.icon),
        h("span", { class: "cat-toggle-title" }, getCatTitle(cat, _mslang)),
        h("span", { class: "cat-toggle-switch" + (enabled ? " on" : "") }),
      );
      catGrid.append(tile);
    });
  }
  renderCats();

  $app.append(h("section", { class: "page narrow" },
    h("button", { class: "btn btn-ghost", onClick: () => navigate(`/result/${r.id}`) }, t("btn_back")),
    h("h1", {}, `${t("map_settings_title")} — ${r.subject}${r.version > 1 ? ` (v${r.version})` : ""}`),
    h("p", { class: "muted small" }, `${t("q_category").replace("Kategorie","Profil").replace("Category","Profile")}: ${profile?.emoji || ""} ${profile?.name || ""}`),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("map_settings_identity")),
        h("p", { class: "muted" }, t("map_settings_identity_sub"))),
      h("div", { class: "form" },
        h("label", {}, t("map_name_label"),
          h("input", { value: r.subject, onChange: e => { r.subject = e.target.value || r.subject; Store.saveResult(r); } })),
        h("label", {}, t("map_emoji_label"),
          h("div", { class: "form-row" },
            h("button", { class: "emoji-display-btn", type: "button",
              onClick: async () => {
                const picked = await pickEmojiDialog(r.subjectEmoji);
                if (picked) { r.subjectEmoji = picked; Store.saveResult(r); route(); }
              }
            }, r.subjectEmoji || "💞", h("span", { class: "muted small" }, " " + t("map_emoji_change"))))),
        h("label", {}, t("map_color_label"),
          h("input", { type: "color", value: r.subjectColor || "#ec4899",
            onChange: e => { r.subjectColor = e.target.value; Store.saveResult(r); } })),
      ),
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("map_scale_title")),
        h("p", { class: "muted" }, t("map_scale_sub"))),
      h("div", { class: "scale-legend-header" },
        h("span", {}),
        h("span", {}, t("scale_col_color")),
        h("span", {}, t("scale_col_label")),
        h("span", {}, t("scale_col_short")),
        h("span", {}),
      ),
      list,
      h("div", { class: "form-actions" },
        h("button", { class: "btn", onClick: () => {
          const newKey = "step-" + Date.now().toString(36);
          r.scale = [...r.scale, { key: newKey, label: t("scale_step_new"), short: t("scale_step_new"), color: pickColor(), description: "" }];
          Store.setResultScale(r.id, r.scale); rerenderScale();
        }}, t("btn_add_step")),
        h("button", { class: "btn btn-ghost", onClick: async () => {
          if (await dlgConfirm(t("confirm_reset_scale"))) {
            r.scale = cloneScale(Store.getScale());
            Store.setResultScale(r.id, r.scale); rerenderScale();
          }
        }}, t("btn_reset_defaults")),
      ),
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, t("map_cats_title")),
        h("p", { class: "muted" }, t("map_cats_sub"))),
      catGrid,
      r.askedItems ? h("div", { class: "callout" },
        h("strong", {}, t("map_asked_items_notice") + " "),
        h("button", { class: "btn", onClick: async () => {
          if (await dlgConfirm(t("confirm_ask_all"))) {
            r.askedItems = null; Store.saveResult(r); route();
          }
        }}, t("btn_ask_all"))) : null,
    ),
  ));
}

// ---------- About ----------
function viewIntro() {
  $app.append(h("section", { class: "page narrow prose" },
    h("h1", {}, t("about_title")),
    h("p", {}, t("about_p1")),
    h("p", {}, t("about_p2")),
    h("h2", {}, t("about_how_title")),
    h("ol", {},
      h("li", {}, t("about_how_1")),
      h("li", {}, t("about_how_2")),
      h("li", {}, t("about_how_3"), " ", h("em", {}, "Need → No"), " ", t("about_how_3b")),
      h("li", {}, t("about_how_4")),
      h("li", {}, t("about_how_5")),
    ),
    h("h2", {}, t("about_privacy_title")),
    h("p", {}, t("about_privacy")),
    h("h2", {}, t("about_ai_title")),
    h("p", {}, t("about_ai_text")),
    h("h2", {}, t("about_credits_title")),
    h("p", {}, t("about_credits"), " ",
      h("a", { href: "https://github.com/Relationshape/Relationshape-Pre-release-1", target: "_blank", rel: "noopener" }, t("about_credits_repo")), ".",
      " ", t("about_credits_unofficial")),
  ));
}
