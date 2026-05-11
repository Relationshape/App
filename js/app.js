// Relationshape – App shell, router and view rendering.
// All state lives in localStorage via Store. No network calls.

import { CATEGORIES, DEFAULT_SCALE, SPIDER_AXES, ONBOARDING_THEMES } from "./data.js";
import { Store } from "./storage.js";
import { encryptResult, decryptResult } from "./crypto.js";
import {
  renderSpider, renderItemSpider, renderCategoryBars, renderAlignment,
  categoryAverage, bindSpiderInteractivity,
} from "./charts.js";

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
function scaleByKeyIn(scale, k) { return scale.find(s => s.key === k) || null; }

// ----- Theme -----
function applyTheme(t) {
  const theme = t || Store.getTheme() || "auto";
  document.documentElement.setAttribute("data-theme", theme);
  Store.setTheme(theme);
  // update meta theme-color
  const dark = theme === "dark" || (theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.remove());
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  meta.content = dark ? "#0f0c1a" : "#f7f5ff";
  document.head.append(meta);
}

// ----- Labels with versioning -----
function resultLabel(r, profile) {
  const v = r.version > 1 ? ` (v${r.version})` : "";
  const pName = profile?.name || (Store.getProfile(r.profileId)?.name) || "?";
  return `${pName} → ${r.subject}${v}`;
}
function importLabel(imp) {
  const v = imp.version > 1 ? ` (v${imp.version})` : "";
  return `${imp.name} → ${imp.subject}${v}`;
}

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
    title: "Pick an emoji",
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
      { label: "Cancel", kind: "ghost", value: null },
      { label: "Use typed", kind: "primary", primary: true,
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
      title: "Reset this answer",
      onClick: e => { e.stopPropagation(); onClear && onClear(); },
    }, "↺ Reset");
    root.append(clear);
  } else {
    root.append(h("div", { class: "rs-slider-hint muted" }, "Drag the slider or tap a label to rate"));
  }

  // Pointer drag on the track
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

  // Keyboard on the wrapper (when focused as a slider)
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

// ----- Asked-items helper (for filtered/import-based maps) -----
function isCategoryEnabled(result, catId) {
  if (!result.enabledCategories) return true;
  return result.enabledCategories.includes(catId);
}
function askedItemsForCat(result, catId) {
  // If askedItems is set, only those are "asked" (the import subset).
  if (result.askedItems && result.askedItems[catId]) {
    return {
      base: result.askedItems[catId].base || [],
      custom: result.askedItems[catId].custom || [],
    };
  }
  // Otherwise the full category + any custom items the user has added.
  return null;
}
function enabledCategoryList(result) {
  return CATEGORIES.filter(c => isCategoryEnabled(result, c.id));
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
      { label: "Cancel", value: null, kind: "ghost" },
      { label: "OK", value: true, kind: "primary", primary: true },
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
    actions: [{ label: "OK", kind: "primary", value: true, primary: true }],
  });
}
async function dlgConfirm(message, { okLabel = "OK", danger = false } = {}) {
  return dialog({
    body: h("p", {}, message),
    actions: [
      { label: "Cancel", kind: "ghost", value: false },
      { label: okLabel, kind: danger ? "danger" : "primary", value: true, primary: true },
    ],
  });
}
async function dlgPrompt({ title, label, placeholder = "", value = "", multiline = false, okLabel = "Save" } = {}) {
  const result = await dialog({
    title,
    fields: [{
      name: "v", label: label || title, value, placeholder,
      type: multiline ? "textarea" : "text", autofocus: true, required: true,
    }],
    actions: [
      { label: "Cancel", kind: "ghost", value: null },
      { label: okLabel, kind: "primary", primary: true,
        handler: vals => (vals.v?.trim() ? vals.v.trim() : false) },
    ],
  });
  return result === null ? null : result;
}

let toastT;
function showToast(msg) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.append(t); }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 1900);
}

// ---------- router ----------
window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  // re-apply on OS theme change in case mode is "auto"
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => applyTheme());
  bindGlobalNav();
  route();
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
    default:         viewHome();
  }
  document.querySelectorAll("#nav a").forEach(a => {
    a.classList.toggle("active", a.getAttribute("href") === "#/" + (segs[0] || ""));
  });
  bindSpiderInteractivity($app);
  window.scrollTo(0, 0);
}

function bindGlobalNav() {
  $nav.innerHTML = `
    <a href="#/" class="nav-brand">
      <span class="nav-logo">∞</span>
      <span class="nav-title">Relationshape</span>
    </a>
    <div class="nav-links">
      <a href="#/" title="Profiles">👤 Profiles</a>
      <a href="#/import" title="Import">📥 Import</a>
      <a href="#/compare" title="Compare">📊 Compare</a>
      <a href="#/settings" title="Settings">⚙️ Settings</a>
      <a href="#/intro" title="About">ℹ️</a>
    </div>`;
}

// ---------- Home / Profile picker ----------
function viewHome() {
  const profiles = Store.getProfiles();
  const imports  = Store.getImports();

  if (!profiles.length && !imports.length) {
    $app.append(viewWelcome());
    return;
  }

  $app.append(h("section", { class: "page" },
    h("header", { class: "page-head" },
      h("h1", {}, "Your profiles"),
      h("p", { class: "muted" }, "Each profile holds your own answers. Keep separate profiles per chapter of life or persona.")),
    h("div", { class: "grid cards" },
      ...profiles.map(profileCard),
      h("button", {
        class: "card card-add",
        onClick: () => navigate("/profile/new"),
      },
        h("div", { class: "card-add-icon" }, "+"),
        h("div", {}, "New profile"))
    ),
    imports.length ? h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "📥 Imported results"),
        h("p", { class: "muted" }, "Encrypted shares from people you trust.")),
      h("div", { class: "list" },
        ...imports.map(importCard))
    ) : null,
  ));
}

function viewWelcome() {
  return h("section", { class: "page hero" },
    h("div", { class: "hero-blob" }),
    h("h1", { class: "hero-title" }, "Relationshape"),
    h("p", { class: "hero-sub" }, "A private space to map your relationships — your needs, your boundaries, your shape."),
    h("div", { class: "hero-actions" },
      h("button", { class: "btn btn-primary", onClick: () => navigate("/profile/new") }, "✨ Create your first profile"),
      h("button", { class: "btn btn-ghost", onClick: () => navigate("/intro") }, "What is Relationshape?")),
    h("ul", { class: "hero-features" },
      h("li", {}, "🔒 Stays on this device"),
      h("li", {}, "📤 End-to-end encrypted sharing"),
      h("li", {}, "📊 Per-category & overview spider charts"),
      h("li", {}, "👥 Multiple profiles in one app")),
  );
}

function profileCard(p) {
  const results = Store.getResultsForProfile(p.id);
  return h("a", { class: "card profile-card", href: `#/profile/${p.id}`, style: `--c:${p.color}` },
    h("div", { class: "avatar" }, p.emoji || "✨"),
    h("h3", {}, p.name),
    p.pronouns ? h("p", { class: "muted small" }, p.pronouns) : null,
    h("p", { class: "small" }, results.length ? `${results.length} relationship${results.length > 1 ? "s" : ""} mapped` : "no results yet"),
  );
}

function importCard(imp) {
  const v = imp.version > 1 ? ` (v${imp.version})` : "";
  return h("div", { class: "list-item", style: `--c:${imp.color || "#7c3aed"}` },
    h("div", { class: "li-avatar" }, imp.emoji || "📨"),
    h("div", { class: "li-body" },
      h("h3", {}, (imp.name || "Imported result") + v),
      h("p", { class: "muted small" }, `For: ${esc(imp.subject || "—")}${v} · imported ${fmtDate(imp.importedAt)}`)),
    h("div", { class: "li-actions" },
      h("button", { class: "btn", onClick: () => navigate("/compare?ids=imp:" + imp.id) }, "Compare"),
      h("button", { class: "btn btn-danger-ghost", onClick: async () => {
        if (await dlgConfirm("Remove imported result?", { danger: true, okLabel: "Delete" })) {
          Store.deleteImport(imp.id); route();
        }
      }}, "Delete"))
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
    h("h1", {}, id ? "Edit profile" : "New profile"),
    h("label", {}, "Display name",
      h("input", { name: "name", value: profile.name, required: true, autofocus: true, placeholder: "e.g. Alex" })),
    h("label", {}, "Pronouns",
      h("input", { name: "pronouns", value: profile.pronouns, placeholder: "she / they · he / him · …" })),
    h("label", {}, "Avatar emoji",
      h("div", { class: "emoji-field" },
        h("input", { name: "emoji", id: "emoji-input", value: profile.emoji, maxlength: 6, placeholder: "🌷" }),
        h("button", { class: "btn", type: "button",
          onClick: async () => {
            const v = await pickEmojiDialog(document.getElementById("emoji-input")?.value || profile.emoji);
            if (v) document.getElementById("emoji-input").value = v;
          },
        }, "✨ Pick"))),
    h("label", {}, "Accent colour",
      h("input", { name: "color", type: "color", value: profile.color })),
    h("div", { class: "form-actions" },
      h("button", { class: "btn btn-primary", type: "submit" }, id ? "Save" : "Create profile"),
      h("button", { class: "btn btn-ghost", type: "button", onClick: () => history.back() }, "Cancel"),
      id ? h("button", { class: "btn btn-danger", type: "button", onClick: async () => {
        if (await dlgConfirm("Delete this profile and all its answers? This cannot be undone.", { danger: true, okLabel: "Delete profile" })) {
          Store.deleteProfile(id); navigate("/");
        }
      }}, "Delete profile") : null,
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
      h("button", { class: "btn", onClick: () => navigate(`/profile/${id}/edit`) }, "✏️ Edit"),
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Relationship maps"),
        h("p", { class: "muted" }, "One map per relationship you want to reflect on. You can revisit & update them anytime.")),
      h("div", { class: "list" },
        ...results.map(r => resultCard(r, profile)),
        h("button", { class: "list-add", onClick: () => createNewResult(profile.id) },
          "➕ Start a new relationship map")),
    ),
  ));
}

function resultCard(r, profile) {
  const cat = r.subjectColor || profile.color;
  const title = (r.subject || "Untitled relationship") + (r.version > 1 ? ` (v${r.version})` : "");
  return h("div", { class: "list-item", style: `--c:${cat}` },
    h("div", { class: "li-avatar" }, r.subjectEmoji || "💞"),
    h("div", { class: "li-body" },
      h("h3", {}, title),
      h("p", { class: "muted small" }, `Updated ${fmtDate(r.updatedAt)} · ${countAnswers(r)} answers`)),
    h("div", { class: "li-actions" },
      h("button", { class: "btn btn-primary", onClick: () => navigate(`/q/${profile.id}/${r.id}`) }, "Continue"),
      h("button", { class: "btn", onClick: () => navigate(`/result/${r.id}`) }, "📊 View"),
      h("button", { class: "btn", onClick: () => navigate(`/share/${r.id}`) }, "📤 Share"),
      h("button", { class: "btn btn-danger-ghost", onClick: async () => {
        if (await dlgConfirm("Delete this relationship map?", { danger: true, okLabel: "Delete" })) {
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

async function createNewResult(profileId) {
  const imports = Store.getImports();

  const choice = await dialog({
    title: "Start a new relationship map",
    body: (close) => h("div", { class: "start-choices" },
      h("button", { class: "start-card", type: "button", onClick: () => close("blank") },
        h("div", { class: "start-icon" }, "✨"),
        h("div", { class: "start-body" },
          h("h3", {}, "Start blank"),
          h("p", { class: "muted small" }, "Default scale; you can optionally pick which categories to focus on."))),
      imports.length ? h("button", { class: "start-card", type: "button", onClick: () => close("import") },
        h("div", { class: "start-icon" }, "📥"),
        h("div", { class: "start-body" },
          h("h3", {}, "Start from an imported result"),
          h("p", { class: "muted small" }, `Inherit the other person's scale, categories and custom items. ${imports.length} import${imports.length>1?"s":""} available.`))) : null,
    ),
    actions: [{ label: "Cancel", kind: "ghost", value: null }],
  });
  if (!choice) return;

  if (choice === "import") return startFromImport(profileId);
  return startBlank(profileId);
}

async function startBlank(profileId) {
  const subject = await dlgPrompt({
    title: "New relationship map",
    label: "What is this map about? Just a private label for you.",
    placeholder: "e.g. Sam, my best friend",
    okLabel: "Continue",
  });
  if (!subject) return;

  // Optional onboarding
  const themes = ONBOARDING_THEMES.map(t => ({ ...t, on: t.defaultOn }));
  const enabled = await runOnboarding(themes);
  // enabled === null → skipped (all categories)
  // enabled === false → cancelled
  if (enabled === false) return;

  const enabledCategories = enabled === null
    ? null
    : computeEnabledCategories(enabled);

  const version = Store.nextResultVersion(profileId, subject);
  const r = Store.saveResult({
    profileId, subject: subject.trim(),
    subjectEmoji: pickEmoji(),
    subjectColor: pickColor(),
    answers: {},
    scale: cloneScale(Store.getScale()),
    enabledCategories,
    askedItems: null,
    progress: { catIndex: 0 },
    version,
  });
  navigate(`/q/${profileId}/${r.id}`);
}

async function startFromImport(profileId) {
  const imports = Store.getImports();
  if (!imports.length) return;

  const chosen = await dialog({
    title: "Pick an import to start from",
    body: (close) => h("div", { class: "compare-grid" },
      ...imports.map(imp => h("button", {
        class: "compare-tile", type: "button",
        style: `--c:${imp.color || "#7c3aed"}`,
        onClick: () => close(imp.id),
      },
        h("div", { class: "li-avatar" }, imp.emoji || "📨"),
        h("div", { class: "compare-tile-body" },
          h("h3", {}, importLabel(imp)),
          h("p", { class: "muted small" }, `Imported ${fmtDate(imp.importedAt)}`)),
        h("span", { class: "compare-tile-arrow" }, "→")))
    ),
    actions: [{ label: "Cancel", kind: "ghost", value: null }],
  });
  if (!chosen) return;
  const imp = imports.find(i => i.id === chosen);
  if (!imp) return;

  const subject = await dlgPrompt({
    title: "Your version of this map",
    label: `What do you want to call your map for ${imp.name}'s "${imp.subject}"?`,
    placeholder: imp.subject,
    value: imp.subject,
    okLabel: "Create",
  });
  if (!subject) return;

  // Derive askedItems + enabled categories from the import's answers.
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

  // Pre-seed __custom names so they show up as questions (without values).
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
  showToast(`Created from ${importLabel(imp)} — same questions, your own answers.`);
  navigate(`/q/${profileId}/${r.id}`);
}

function cloneScale(s) { return (s || []).map(x => ({ ...x })); }

// returns: null = "skip / all categories" ; false = cancelled ; or themes obj
async function runOnboarding(themes) {
  return dialog({
    title: "Quick onboarding",
    body: (close) => h("div", { class: "onboarding-body" },
      h("p", { class: "muted small" }, "Toggle which broad themes apply to this relationship. You can change this later. Skip to include everything."),
      h("div", { class: "onboard-toggles" },
        ...themes.map(t => {
          const row = h("button", {
            class: "onboard-toggle" + (t.on ? " is-on" : ""),
            type: "button",
            onClick: () => {
              t.on = !t.on;
              row.classList.toggle("is-on", t.on);
              row.querySelector(".onboard-switch").classList.toggle("on", t.on);
            },
          },
            h("div", { class: "onboard-text" },
              h("strong", {}, t.title),
              h("p", { class: "muted small" }, t.blurb)),
            h("div", { class: "onboard-switch" + (t.on ? " on" : "") }),
          );
          return row;
        })),
    ),
    actions: [
      { label: "Skip — include everything", kind: "ghost", value: null },
      { label: "Use these themes", kind: "primary", primary: true,
        handler: () => themes },
    ],
  }).catch(() => false);
}

function computeEnabledCategories(themes) {
  // Start: every category is candidate. Then remove any whose categories
  // are exclusively in turned-off themes.
  const onSet = new Set();
  for (const t of themes) {
    if (t.on) t.categories.forEach(c => onSet.add(c));
  }
  // For categories not gated by any theme, include them by default.
  const themedCategoryIds = new Set();
  ONBOARDING_THEMES.forEach(t => t.categories.forEach(c => themedCategoryIds.add(c)));
  const enabled = [];
  for (const cat of CATEGORIES) {
    if (!themedCategoryIds.has(cat.id) || onSet.has(cat.id)) enabled.push(cat.id);
  }
  return enabled;
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

  const mode = result.progress?.mode || (matchMedia("(pointer: coarse)").matches ? "single" : "list");
  if (mode === "single") return viewQuestionnaireSingle(profile, result);
  return viewQuestionnaireList(profile, result);
}

function setMode(result, mode) {
  result.progress = result.progress || {};
  const prevMode = result.progress.mode;
  result.progress.mode = mode;
  // Sync the cursors so each mode lands on the same question.
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

  const root = h("section", { class: "page q-page" },
    qHeader({ profileId, resultId, idx, total, cat, progressPct, result, mode: "list", isItemBased: false }),
    h("section", { class: "q-cat", style: `--c:${cat.color}` },
      h("div", { class: "q-cat-head" },
        h("span", { class: "q-cat-icon" }, cat.icon),
        h("div", {},
          h("h1", {}, cat.title),
          h("p", { class: "muted" }, cat.blurb),
          cat.gr ? h("p", { class: "muted small" }, "Tip: items here support a “Giving / Receiving / Both” marker.") : null,
          h("p", { class: "muted small" }, `⌨️ Tip: focus a question and press 1–${SCALE.length} to rate, ${SCALE.length+1} to skip, Enter to advance.`)
        ),
      ),
      h("div", { class: "scale-legend" }, ...SCALE.map((s, i) =>
        h("span", { class: "chip", style: `--c:${s.color}`, title: s.description || "" },
          h("span", { class: "chip-num" }, String(i + 1)), " ", s.label))),

      h("div", { class: "q-items" },
        ...baseItems.map(item => itemRow(cat, item, answers, false, SCALE)),
        ...customNames.map(name =>
          itemRow(cat, name, answers.__custom, true, SCALE)),
        h("button", { class: "q-add", onClick: async () => {
          const name = await dlgPrompt({
            title: "Add a custom item",
            label: "Name of the new item",
            placeholder: "e.g. astronomy",
            okLabel: "Add",
          });
          if (!name) return;
          if (cat.items.includes(name) || answers.__custom[name]) {
            return showToast("That item already exists.");
          }
          answers.__custom[name] = { scale: "open" };
          persist(); rerender();
        }}, "➕ Add custom item"),
      ),
    ),

    h("nav", { class: "q-nav" },
      h("button", { class: "btn", disabled: idx === 0, onClick: () => move(-1) }, "← Previous"),
      h("button", { class: "btn", onClick: () => navigate(`/result/${resultId}`) }, "Skip to results"),
      h("button", { class: "btn btn-primary", onClick: () => move(1) },
        idx === total - 1 ? "Finish ✨" : "Next →"),
    )
  );

  $app.append(root);
  // Prefer the focusItem that was synced from single mode, otherwise first unanswered.
  let target = null;
  const focusItem = result.progress?.focusItem;
  if (focusItem && focusItem.catId === cat.id) {
    target = Array.from(root.querySelectorAll(".q-item")).find(el =>
      el.dataset.itemKey === focusItem.item);
    // clear it once consumed
    delete result.progress.focusItem;
    Store.saveResult(result);
  }
  if (!target) {
    target = Array.from(root.querySelectorAll(".q-item")).find(el => !el.dataset.answered)
      || root.querySelector(".q-item");
  }
  if (target) {
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "center", behavior: "instant" });
  }

  function persist() { Store.saveResult(result); }
  function move(d) {
    result.progress = result.progress || {};
    result.progress.catIndex = Math.max(0, Math.min(total, idx + d));
    persist();
    if (result.progress.catIndex >= total) navigate(`/result/${resultId}`);
    else route();
  }
  function rerender() { $app.innerHTML = ""; viewQuestionnaireList(profile, result); }

  function itemRow(cat, item, store, isCustom, SCALE) {
    const existing = store[item] || {};
    const answered = !!existing.scale;
    const row = h("div", {
      class: "q-item" + (answered ? " is-answered" : ""),
      tabindex: "0",
      "data-answered": answered ? "1" : null,
      "data-item-key": item,
    },
      h("div", { class: "q-item-name" },
        isCustom ? h("span", { class: "q-item-tag" }, "custom") : null,
        item,
        isCustom ? h("button", { class: "icon-btn", title: "Remove", onClick: e => {
          e.stopPropagation();
          delete store[item]; persist(); rerender();
        }}, "✕") : null
      ),
      h("div", { class: "q-slider-wrap" },
        scaleSliderEl({
          scale: SCALE,
          valueKey: existing.scale,
          onChange: (key) => applyScale(key),
          onClear: () => applyScale(null),
        }),
      ),
      cat.gr ? h("div", { class: "gr-pick" },
        ["G","R","×"].map(g => h("button", {
          class: "gr-btn" + (existing.gr === g ? " is-active" : ""),
          title: g === "G" ? "Giving" : g === "R" ? "Receiving" : "Both",
          tabindex: "-1",
          onClick: e => {
            e.stopPropagation();
            store[item] = { ...(store[item] || { scale: "open" }), gr: existing.gr === g ? null : g };
            persist(); rerender();
          }
        }, g))
      ) : null,
      h("input", {
        class: "q-note",
        type: "text",
        placeholder: "Note (optional)…",
        value: existing.note || "",
        onChange: e => { store[item] = { ...(store[item] || { scale: "open" }), note: e.target.value }; persist(); }
      }),
    );

    function applyScale(key, { advance = true } = {}) {
      if (key == null) {
        // explicit clear: remove the entry entirely
        delete store[item];
      } else {
        store[item] = { ...existing, scale: key };
      }
      persist();
      const next = advance && key != null ? nextItemElement(row) : null;
      rerender();
      if (next) {
        requestAnimationFrame(() => {
          if (!next) return;
          const all = Array.from(document.querySelectorAll(".q-item"));
          const idx = parseInt(next.dataset.idx || "-1", 10);
          const el = idx >= 0 ? all[idx] : null;
          if (!el) return;
          el.focus({ preventScroll: true });
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
      if (e.target !== row) return; // keys only act on item itself
      const n = parseInt(e.key, 10);
      if (!isNaN(n) && n >= 1 && n <= SCALE.length) {
        e.preventDefault();
        applyScale(SCALE[n - 1].key);
      } else if (e.key === "0" || (!isNaN(n) && n === SCALE.length + 1)) {
        e.preventDefault();
        applyScale(null, { advance: false });
      } else if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        const all = Array.from(document.querySelectorAll(".q-item"));
        const i = all.indexOf(row);
        all[i + 1]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const all = Array.from(document.querySelectorAll(".q-item"));
        const i = all.indexOf(row);
        all[i - 1]?.focus();
      }
    });

    return row;
  }
}

function qHeader({ profileId, resultId, idx, total, cat, progressPct, result, mode, isItemBased }) {
  const stepLabel = isItemBased
    ? `Item ${idx + 1} of ${total}`
    : `Category ${idx + 1} of ${total}`;
  return h("header", { class: "q-head" },
    h("button", { class: "btn btn-ghost", onClick: () => navigate(`/profile/${profileId}`) }, "← Back"),
    h("div", { class: "q-progress" },
      h("div", { class: "q-progress-bar" },
        h("div", { class: "q-progress-fill", style: `width:${progressPct}%; background:${cat.color}` })),
      h("div", { class: "q-progress-text" },
        h("span", { class: "q-cat-pip" }, cat.icon, " ", cat.title),
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
        title: "One item at a time, swipe to skip",
      }, "📱 Single"),
    ),
    h("button", {
      class: "btn icon-only",
      title: "Keyboard shortcuts",
      "aria-label": "Keyboard shortcuts",
      onClick: () => showKeyboardHelpDialog(mode),
    }, "⌨️"),
    h("button", { class: "btn", onClick: () => navigate(`/result/${resultId}`) }, "📊 Results"),
  );
}

// ---------- Single / Tinder questionnaire ----------
function flatItems() {
  const out = [];
  CATEGORIES.forEach(cat => {
    cat.items.forEach(item => out.push({ catId: cat.id, item, isCustom: false, cat }));
  });
  return out;
}

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

  const root = h("section", { class: "page q-page q-single-page" },
    qHeader({
      profileId, resultId,
      idx: cursor, total: items.length, isItemBased: true,
      cat: items[cursor].cat,
      progressPct: ((cursor + 1) / items.length) * 100,
      result, mode: "single",
    }),
    stack,
  );

  $app.append(root);
  renderCard();

  function renderCard() {
    if (cursor >= items.length) {
      stack.innerHTML = "";
      stack.append(h("div", { class: "q-done" },
        h("h1", {}, "All done ✨"),
        h("p", { class: "muted" }, "You've walked through every item. Review your map below."),
        h("div", { class: "form-actions" },
          h("button", { class: "btn", onClick: () => { cursor = 0; renderCard(); } }, "Start over"),
          h("button", { class: "btn btn-primary", onClick: () => navigate(`/result/${resultId}`) }, "📊 See results"),
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

    // Update header dynamically.
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
    requestAnimationFrame(() => card.classList.add("in"));
  }

  function makeCard(it, isPeek) {
    const slot = result.answers?.[it.catId];
    const store = it.isCustom ? slot?.__custom : slot;
    const existing = store?.[it.item] || {};

    const card = h("article", { class: "q-card" + (isPeek ? " is-peek" : ""), style: `--c:${it.cat.color}` },
      h("div", { class: "q-card-cat" },
        h("span", { class: "q-card-icon" }, it.cat.icon),
        h("span", {}, it.cat.title),
        it.isCustom ? h("span", { class: "q-item-tag" }, "custom") : null,
      ),
      h("h1", { class: "q-card-item" }, it.item),
      h("p", { class: "q-card-blurb muted" }, it.cat.blurb),
      h("div", { class: "q-card-slider" },
        scaleSliderEl({
          scale: SCALE,
          valueKey: existing.scale,
          onChange: (key) => { setStore(it, prev => ({ ...(prev || {}), scale: key })); renderCard(); },
          onClear: () => { setStore(it, prev => { const c = { ...(prev || {}) }; delete c.scale; return c; }); renderCard(); },
        })),
      it.cat.gr ? h("div", { class: "q-card-gr" },
        ["G","R","×"].map(g => h("button", {
          class: "gr-btn" + (existing.gr === g ? " is-active" : ""),
          onClick: e => { e.stopPropagation(); setGR(it, g); }
        }, g))
      ) : null,
      h("input", {
        class: "q-card-note",
        type: "text",
        placeholder: "Note (optional)…",
        value: existing.note || "",
        onChange: e => setNote(it, e.target.value),
      }),
      h("div", { class: "q-card-actions" },
        h("button", { class: "btn", onClick: () => advance(null, "back") }, "← Back"),
        h("button", {
          class: "btn btn-primary",
          onClick: () => advance(null, existing.scale ? "right" : "left"),
        }, existing.scale ? "Next →" : "Skip →"),
      ),
      h("div", { class: "q-card-progress" }, `${cursor + 1} / ${items.length}`),
    );
    return card;
  }

  function rate(it, scaleKey) {
    setStore(it, prev => ({ ...(prev || {}), scale: scaleKey }));
    advance(scaleKey, "right");
  }
  function setGR(it, g) {
    setStore(it, prev => {
      const cur = prev || { scale: "open" };
      return { ...cur, gr: cur.gr === g ? null : g };
    });
    renderCard();
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

  // Keyboard
  const onKey = (e) => {
    if (e.target.matches("input, textarea")) return;
    const n = parseInt(e.key, 10);
    if (!isNaN(n) && n >= 1 && n <= SCALE.length) {
      e.preventDefault();
      // 1. Update the slider visually so the user sees their vote.
      const cur = items[cursor];
      const key = SCALE[n - 1].key;
      setStore(cur, prev => ({ ...(prev || {}), scale: key }));
      renderCard();
      // 2. Then animate away after a brief beat.
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
  // Detach on next route.
  const detach = () => { document.removeEventListener("keydown", onKey); window.removeEventListener("hashchange", detach); };
  window.addEventListener("hashchange", detach);
}

function bindSwipe(el, { onLeft, onRight, threshold = 80 } = {}) {
  let startX = null, startY = null, dx = 0, dy = 0, dragging = false;
  const start = e => {
    const t = e.touches ? e.touches[0] : e;
    if (!t) return;
    if (e.target.closest("button, input, textarea, .scale-pill, .gr-btn")) return;
    startX = t.clientX; startY = t.clientY; dx = 0; dy = 0; dragging = true;
    el.classList.add("dragging");
  };
  const move = e => {
    if (!dragging) return;
    const t = e.touches ? e.touches[0] : e;
    if (!t) return;
    dx = t.clientX - startX;
    dy = t.clientY - startY;
    if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dy) > 30) return; // vertical scroll
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
function itemCategoryIndex(catId) { return CATEGORIES.findIndex(c => c.id === catId); }

function showKeyboardHelpDialog(mode = "list") {
  const row = (k, t) => h("div", { class: "kbd-row" },
    h("kbd", { class: "kbd" }, k), h("span", {}, t));
  return dialog({
    title: "Keyboard shortcuts",
    body: h("div", { class: "kbd-help" },
      h("p", { class: "muted small" }, "Works on desktop in both questionnaire modes."),
      mode === "single" ? h("div", { class: "kbd-section" },
        h("h3", {}, "Single mode (one item at a time)"),
        row("1 – 9", "Rate with that step (briefly shown, then auto-advance)"),
        row("→  /  Enter", "Skip / next without rating"),
        row("←", "Previous"),
        row("Space", "Skip"),
      ) : h("div", { class: "kbd-section" },
        h("h3", {}, "List mode (all items in category)"),
        row("Tab", "Move between items"),
        row("1 – 9", "Rate the focused item"),
        row("0", "Clear the focused item's rating"),
        row("Enter  /  ↓", "Next item"),
        row("↑", "Previous item"),
      ),
      h("div", { class: "kbd-section" },
        h("h3", {}, "Slider"),
        row("← / →", "Step lower / higher"),
        row("Home / End", "Lowest / highest"),
        row("Backspace", "Clear rating"),
      )),
    actions: [{ label: "Got it", kind: "primary", primary: true, value: true }],
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
      h("button", { class: "btn btn-ghost", onClick: () => navigate(`/profile/${profile.id}`) }, "← Back"),
      h("div", { class: "li-avatar" }, r.subjectEmoji || "💞"),
      h("div", {},
        h("h1", {}, r.subject + (r.version > 1 ? ` (v${r.version})` : "")),
        h("p", { class: "muted" }, `${profile.emoji} ${profile.name} · ${countAnswers(r)} answers · last edited ${fmtDate(r.updatedAt)}`)),
      h("div", { class: "flex-spacer" }),
      h("button", { class: "btn", onClick: () => navigate(`/map/${r.id}/settings`) }, "⚙️ Map settings"),
      h("button", { class: "btn", onClick: () => navigate(`/q/${profile.id}/${r.id}`) }, "✏️ Continue editing"),
      h("button", { class: "btn btn-primary", onClick: () => navigate(`/share/${r.id}`) }, "📤 Share"),
    ),

    // Overview spider — only when Fabi mode is on (category averages can be misleading).
    Store.getFabiMode() ? h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Category overview"),
        h("p", { class: "muted" }, "Averaged per category — the further out, the more important to you on average.")),
      h("div", { class: "panel", html: renderSpider([dataset], { size: 540 }) })) : null,

    // Compare picker
    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Compare with someone")),
      h("div", { class: "compare-pickers" },
        compareTargetPicker(profile.id, r.id))),

    // By category
    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "By category"),
        h("p", { class: "muted" }, "Open a card to see a per-item spider chart and the underlying breakdown.")),
      h("div", { class: "cat-grid" }, ...categoryCards([dataset]))),

  ));
}

function categoryCards(datasets) {
  const fabi = Store.getFabiMode();
  return CATEGORIES.map(cat => {
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
      onClick: () => openCategoryModal(datasets, cat),
    },
      h("div", { class: "cat-card-head" },
        h("div", { class: "cat-card-icon" }, cat.icon),
        h("div", { class: "cat-card-titles" },
          h("h3", {}, cat.title),
          h("p", { class: "muted small" }, cat.blurb)),
        fabi ? h("div", { class: "cat-card-summary", html: summaryCellsHTML(datasets, cat.id) }) : null,
        h("span", { class: "cat-card-toggle", "aria-hidden": "true" }, "→"),
      ),
    );
    if (filledCount === 0) card.classList.add("is-empty");
    return card;
  });
}

function openCategoryModal(datasets, cat) {
  return dialog({
    title: undefined,
    body: (close) => {
      const body = h("div", { class: "cat-modal-body", style: `--c:${cat.color}` },
        h("header", { class: "cat-modal-head" },
          h("span", { class: "cat-modal-icon" }, cat.icon),
          h("div", {},
            h("h2", {}, cat.title),
            h("p", { class: "muted small" }, cat.blurb)),
        ),
        h("section", { class: "cat-modal-spider" },
          h("div", { html: renderItemSpider(datasets, cat.id, { size: 580 }) })),
        h("section", { class: "cat-modal-bars" },
          h("h3", {}, "Item-by-item"),
          h("div", { html: renderCategoryBars(datasets, cat.id) })),
      );
      requestAnimationFrame(() => bindSpiderInteractivity(body));
      return body;
    },
    actions: [{ label: "Close", kind: "ghost", value: null, primary: true }],
  });
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
    return h("p", { class: "muted" }, "Create another relationship map or import a shared one to compare.");
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

  return h("div", { class: "compare-grid" },
    ...others.map(o => {
      const op = Store.getProfile(o.profileId);
      return tile({
        id: o.id,
        emoji: o.subjectEmoji || op?.emoji || "💞",
        color: o.subjectColor || op?.color,
        title: `${op?.name || "?"} → ${o.subject}`,
        sub: `Updated ${fmtDate(o.updatedAt)}`,
      });
    }),
    ...imports.map(i => tile({
      id: "imp:" + i.id,
      emoji: i.emoji || "📨",
      color: i.color || "#7c3aed",
      title: `${i.name} → ${i.subject}`,
      sub: `Imported ${fmtDate(i.importedAt)}`,
    })),
  );
}

// ---------- Share view ----------
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
    h("h2", {}, "Your encrypted bundle"),
    h("p", { class: "muted" }, "Copy this text or download the file. Keep the passphrase separate."),
    output,
    h("div", { class: "form-actions" },
      h("button", { class: "btn", onClick: async () => {
        await navigator.clipboard.writeText(output.value); showToast("Copied!");
      }}, "📋 Copy text"),
      h("button", { class: "btn", onClick: () => {
        const blob = new Blob([output.value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relationshape-${slug(profile.name)}-${slug(r.subject)}.rshape.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }}, "💾 Download file")),
  );

  const root = h("section", { class: "page narrow" },
    h("button", { class: "btn btn-ghost", onClick: () => navigate(`/result/${resultId}`) }, "← Back"),
    h("h1", {}, "📤 Share encrypted result"),
    h("p", {}, "Your answers will be packaged and encrypted with a passphrase. Send the bundle via any channel — and tell the other person the passphrase ", h("strong", {}, "separately"), " (e.g. by phone or in person)."),
    h("div", { class: "callout" },
      h("strong", {}, "🔐 No server, no traces. "),
      "Encryption happens on this device. The passphrase never leaves your head."),

    h("form", { class: "form", onSubmit: async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const pass = fd.get("pass");
      const passConfirm = fd.get("passConfirm");
      if (pass.length < 6) return dlgAlert("Please choose at least 6 characters.");
      if (pass !== passConfirm) return dlgAlert("The two passphrases don't match.");
      const blob = await encryptResult(payload, pass);
      output.value = blob;
      out.style.display = "block";
      out.scrollIntoView({ behavior: "smooth" });
    }},
      h("label", {}, "Passphrase",
        h("input", { name: "pass", type: "password", autocomplete: "new-password", required: true, minlength: 6 })),
      h("label", {}, "Repeat passphrase",
        h("input", { name: "passConfirm", type: "password", autocomplete: "new-password", required: true })),
      h("div", { class: "form-actions" },
        h("button", { class: "btn btn-primary", type: "submit" }, "🔒 Encrypt & generate share")),
    ),
    out,
  );

  $app.append(root);
}

function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24); }

// ---------- Import view ----------
function viewImport() {
  const root = h("section", { class: "page narrow" },
    h("h1", {}, "📥 Import a shared result"),
    h("p", {}, "Paste the encrypted bundle below or load a ", h("code", {}, ".rshape.txt"), " file. Decryption happens locally."),

    h("form", { class: "form", onSubmit: async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const blob = (fd.get("blob") || "").toString().trim();
      const pass = (fd.get("pass") || "").toString();
      if (!blob) return dlgAlert("Paste an encrypted bundle first.");
      try {
        const payload = await decryptResult(blob, pass);
        if (payload.type !== "relationshape-result") throw new Error("This bundle is not a Relationshape result.");
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
        showToast(version > 1 ? `Imported as v${version} ✔` : "Imported ✔");
        navigate(`/compare?ids=imp:${imp.id}`);
      } catch (err) {
        dlgAlert(err.message || "Could not decrypt.", "Import failed");
      }
    }},
      h("label", {}, "Encrypted bundle",
        h("textarea", { name: "blob", rows: 10, placeholder: "-----BEGIN RELATIONSHAPE BUNDLE-----\nv1\n…\n-----END RELATIONSHAPE BUNDLE-----" })),
      h("label", {}, "Or load a file",
        h("input", { type: "file", accept: ".txt,.rshape,.json", onChange: e => {
          const f = e.target.files[0]; if (!f) return;
          const reader = new FileReader();
          reader.onload = () => { document.querySelector("[name=blob]").value = reader.result; };
          reader.readAsText(f);
        }})),
      h("label", {}, "Passphrase",
        h("input", { name: "pass", type: "password", autocomplete: "off", required: true })),
      h("div", { class: "form-actions" },
        h("button", { class: "btn btn-primary", type: "submit" }, "🔓 Decrypt & import")),
    )
  );
  $app.append(root);
}

// ---------- Compare view ----------
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
      h("h1", {}, "📊 Compare"),
      h("p", { class: "muted" }, "Pick up to four results to overlay. Open a category for a per-item spider chart.")),

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
      ? h("div", { class: "callout" }, "Select results above.")
      : (Store.getFabiMode()
          ? h("div", { class: "panel", html: renderSpider(datasets, { size: 560 }) })
          : h("div", { class: "callout muted small" },
              "Tip: enable “Fabi mode” in Settings to also see a per-category averages spider chart here. Otherwise pick a category below to compare item by item.")),

    selected.length >= 2 ? h("section", { class: "page-section" },
      h("header", { class: "section-head" }, h("h2", {}, "Alignment overview")),
      h("div", { class: "panel", html: renderAlignment(datasets) })
    ) : null,

    selected.length >= 1 ? h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Category details"),
        h("p", { class: "muted" }, "Each card opens a spider chart of the items inside it.")),
      h("div", { class: "cat-grid" }, ...categoryCards(datasets))
    ) : null,
  );
  $app.append(root);
}

// ---------- Settings view ----------
function viewSettings() {
  const SCALE = Store.getScale();
  const used = {};
  SCALE.forEach(s => { used[s.key] = Store.scaleHasData(s.key); });

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
        h("input", { class: "scale-row-label", type: "text", value: s.label, placeholder: "Long label",
          onChange: (e) => { fresh[i].label = e.target.value || s.label; Store.setScale(fresh); }
        }),
        h("input", { class: "scale-row-short", type: "text", value: s.short, maxlength: 24, placeholder: "Short",
          onChange: (e) => { fresh[i].short = (e.target.value || s.short).slice(0, 24); Store.setScale(fresh); }
        }),
        h("input", { class: "scale-row-desc", type: "text", value: s.description || "", placeholder: "Tooltip / description",
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
                if (!await dlgConfirm(`The step "${s.label}" is in use in some answers. Removing it will clear those answers. Continue?`, { danger: true, okLabel: "Remove" })) return;
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

  function swap(arr, a, b) { const t = arr[a]; arr[a] = arr[b]; arr[b] = t; }

  function clearScaleKey(key) {
    // Remove all answers using this key.
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
    for (const i of data.imports) scrub(i.answers);
    localStorage.setItem("relationshape.v1", JSON.stringify(data));
  }

  rerender();

  const theme = Store.getTheme();
  const themeRow = h("div", { class: "theme-picker" },
    ...[
      { v: "auto",  label: "🖥 Auto (follow OS)" },
      { v: "light", label: "☀️ Light" },
      { v: "dark",  label: "🌙 Dark" },
    ].map(opt => h("button", {
      class: "theme-pick" + (theme === opt.v ? " is-on" : ""),
      type: "button",
      onClick: () => { applyTheme(opt.v); route(); },
    }, opt.label))
  );

  $app.append(h("section", { class: "page narrow" },
    h("h1", {}, "⚙️ Settings"),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Appearance")),
      themeRow,
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Display modes")),
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
              h("strong", {}, "Fabi mode"),
              h("p", { class: "muted small" },
                "Show a category-averages spider chart on the result and compare pages, and small per-category summary chips on the cards. Off by default because averaging across very different items can be misleading.")),
            h("div", { class: "onboard-switch" + (fabi ? " on" : "") }),
          );
          return row;
        })()),
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Default answer scale"),
        h("p", { class: "muted" }, "Used as the starting point when you create a new map. Each map keeps its own copy of the scale, so editing here only affects future maps.")),
      list,
      h("div", { class: "form-actions" },
        h("button", { class: "btn", onClick: () => {
          const SCALE = Store.getScale();
          const newKey = "step-" + Date.now().toString(36);
          const fresh = [...SCALE, {
            key: newKey, label: "New step", short: "New",
            color: pickColor(), description: "",
          }];
          Store.setScale(fresh); rerender();
        }}, "➕ Add step"),
        h("button", { class: "btn btn-ghost", onClick: async () => {
          if (await dlgConfirm("Reset the scale to the default 7 steps?")) {
            Store.resetScale(); rerender();
          }
        }}, "Reset to defaults"))
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" }, h("h2", {}, "Data")),
      h("div", { class: "form-actions" },
        h("button", { class: "btn", onClick: () => {
          const data = Store.exportAll();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "relationshape-backup.json";
          a.click(); URL.revokeObjectURL(url);
        }}, "💾 Download local backup"),
        h("button", { class: "btn", onClick: () => promptRestoreBackup() }, "📂 Restore from backup"),
        h("button", { class: "btn btn-danger-ghost", onClick: async () => {
          if (await dlgConfirm("Erase ALL data on this device — profiles, maps, imports, settings? This cannot be undone.", { danger: true, okLabel: "Erase everything" })) {
            Store.wipe(); navigate("/");
          }
        }}, "🗑 Erase all local data"))
    ),
  ));
}

async function promptRestoreBackup() {
  const input = h("input", { type: "file", accept: ".json,application/json" });
  const choice = await dialog({
    title: "Restore from backup",
    body: (close) => h("div", { class: "form" },
      h("p", { class: "muted small" }, "This will replace ALL data currently on this device with the contents of the backup. Your existing profiles, maps and imports will be lost."),
      h("label", {}, "Backup file (.json)", input),
    ),
    actions: [
      { label: "Cancel", kind: "ghost", value: null },
      { label: "Replace all data", kind: "danger", primary: true,
        handler: async () => {
          const f = input.files?.[0];
          if (!f) { showToast("Pick a file first."); return false; }
          const text = await f.text();
          let parsed;
          try { parsed = JSON.parse(text); }
          catch { showToast("Not a valid JSON file."); return false; }
          try { Store.replaceAll(parsed); }
          catch (e) { showToast(e.message); return false; }
          return true;
        }
      },
    ],
  });
  if (choice) { applyTheme(); showToast("Backup restored"); navigate("/"); }
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
        h("input", { class: "scale-row-label", type: "text", value: s.label, placeholder: "Long label",
          onChange: (e) => { fresh[i].label = e.target.value || s.label; Store.setResultScale(r.id, fresh); }
        }),
        h("input", { class: "scale-row-short", type: "text", value: s.short, maxlength: 24, placeholder: "Short",
          onChange: (e) => { fresh[i].short = (e.target.value || s.short).slice(0, 24); Store.setResultScale(r.id, fresh); }
        }),
        h("input", { class: "scale-row-desc", type: "text", value: s.description || "", placeholder: "Tooltip / description",
          onChange: (e) => { fresh[i].description = e.target.value; Store.setResultScale(r.id, fresh); }
        }),
        h("div", { class: "scale-row-actions" },
          h("button", { class: "icon-btn", title: "Move up", disabled: i === 0,
            onClick: () => { const t = fresh[i]; fresh[i] = fresh[i-1]; fresh[i-1] = t; Store.setResultScale(r.id, fresh); rerenderScale(); } }, "↑"),
          h("button", { class: "icon-btn", title: "Move down", disabled: i === fresh.length - 1,
            onClick: () => { const t = fresh[i]; fresh[i] = fresh[i+1]; fresh[i+1] = t; Store.setResultScale(r.id, fresh); rerenderScale(); } }, "↓"),
          h("button", { class: "icon-btn danger", title: "Remove", disabled: fresh.length <= 2,
            onClick: () => { fresh.splice(i, 1); Store.setResultScale(r.id, fresh); rerenderScale(); } }, "🗑"),
        )
      );
      list.append(row);
    });
  }
  rerenderScale();

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
        h("span", { class: "cat-toggle-title" }, cat.title),
        h("span", { class: "cat-toggle-switch" + (enabled ? " on" : "") }),
      );
      catGrid.append(tile);
    });
  }
  renderCats();

  $app.append(h("section", { class: "page narrow" },
    h("button", { class: "btn btn-ghost", onClick: () => navigate(`/result/${r.id}`) }, "← Back"),
    h("h1", {}, "⚙️ Map settings — " + r.subject + (r.version > 1 ? ` (v${r.version})` : "")),
    h("p", { class: "muted small" }, `Profile: ${profile?.emoji || ""} ${profile?.name || ""}`),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Identity"),
        h("p", { class: "muted" }, "Visual identity of this relationship map.")),
      h("div", { class: "form" },
        h("label", {}, "Map name (subject)",
          h("input", { value: r.subject, onChange: e => { r.subject = e.target.value || r.subject; Store.saveResult(r); } })),
        h("label", {}, "Avatar emoji",
          h("div", { class: "form-row" },
            h("button", { class: "emoji-display-btn", type: "button",
              onClick: async () => {
                const picked = await pickEmojiDialog(r.subjectEmoji);
                if (picked) { r.subjectEmoji = picked; Store.saveResult(r); route(); }
              }
            }, r.subjectEmoji || "💞", h("span", { class: "muted small" }, " · click to change")))),
        h("label", {}, "Accent colour",
          h("input", { type: "color", value: r.subjectColor || "#ec4899",
            onChange: e => { r.subjectColor = e.target.value; Store.saveResult(r); } })),
      ),
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Answer scale (this map only)"),
        h("p", { class: "muted" }, "These steps are stored with this map and will travel along when you share it. Other maps and profiles use their own scale.")),
      list,
      h("div", { class: "form-actions" },
        h("button", { class: "btn", onClick: () => {
          const newKey = "step-" + Date.now().toString(36);
          r.scale = [...r.scale, { key: newKey, label: "New step", short: "New", color: pickColor(), description: "" }];
          Store.setResultScale(r.id, r.scale); rerenderScale();
        }}, "➕ Add step"),
        h("button", { class: "btn btn-ghost", onClick: async () => {
          if (await dlgConfirm("Reset this map's scale to the default scale?")) {
            r.scale = cloneScale(Store.getScale());
            Store.setResultScale(r.id, r.scale); rerenderScale();
          }
        }}, "Reset to defaults"),
      ),
    ),

    h("section", { class: "page-section" },
      h("header", { class: "section-head" },
        h("h2", {}, "Categories"),
        h("p", { class: "muted" }, "Toggle which categories this map will ask about. Hidden categories keep their existing answers (if any) but won't appear in the questionnaire.")),
      catGrid,
      r.askedItems ? h("div", { class: "callout" },
        h("strong", {}, "This map was started from an import. "),
        "By default it only asks about the items the other person also answered. ",
        h("button", { class: "btn", onClick: async () => {
          if (await dlgConfirm("Expand this map to ask all items in the enabled categories?")) {
            r.askedItems = null; Store.saveResult(r); route();
          }
        }}, "Ask all items in enabled categories")) : null,
    ),
  ));
}

// ---------- Intro / About ----------
function viewIntro() {
  $app.append(h("section", { class: "page narrow prose" },
    h("h1", {}, "About Relationshape"),
    h("p", {}, "Relationshape is a communication tool to help shape relationships around the actual needs and desires of everyone involved — independently from outside norms or hierarchies."),
    h("p", {}, "It comes from the world of relationship anarchy and was inspired by Andie Nordgren’s manifesto, the Smorgasbord of relationship anarchy, and books like Polysecure (Jessica Fern) and More than Two (Eve Rickert & Franklin Veaux)."),
    h("h2", {}, "How to use this app"),
    h("ol", {},
      h("li", {}, "Create a profile for yourself."),
      h("li", {}, "Start a relationship map for each connection you want to reflect on."),
      h("li", {}, "Walk through the categories at your own pace. Use ", h("em", {}, "Need → No"), " (or your own custom scale) to mark how important each item is."),
      h("li", {}, "Open a category in the result view to see a spider chart of its items."),
      h("li", {}, "Optionally exchange your encrypted bundle with the other person and compare."),
    ),
    h("h2", {}, "Privacy"),
    h("p", {}, "Everything stays in your browser’s local storage on this device. The app has no backend. Shared bundles are encrypted with AES-GCM (256-bit) using a key derived from your passphrase via PBKDF2 (250 000 iterations). Pick a passphrase you and the other person agree on out of band — for example, in person or via a secure messenger."),
    h("h2", {}, "Credits"),
    h("p", {}, "The Relationshape questionnaire and concept are by Anne Lüscher (she/they) and Benjamin Frey (him/his), released under CC BY-NC 4.0. ",
      h("a", { href: "https://github.com/Relationshape/Relationshape-Pre-release-1", target: "_blank", rel: "noopener" }, "Original repository"), ".",
      " This app is an unofficial implementation built to make the tool more interactive and accessible."),
  ));
}
