// Local-only storage for profiles, answer-sets and imported results.
// All data lives in window.localStorage; nothing is sent anywhere.

import { DEFAULT_SCALE } from "./data.js";

const KEY = "relationshape.v1";

function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw);
    if (!data.profiles) data.profiles = [];
    if (!data.results)  data.results  = [];
    if (!data.imports)  data.imports  = [];
    return data;
  } catch {
    return defaults();
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

function defaults() {
  return {
    profiles: [], results: [], imports: [],
    settings: { theme: "auto" },
    scale: cloneScale(DEFAULT_SCALE),
  };
}

function cloneScale(s) {
  return s.map(x => ({ ...x }));
}

function recalcScaleValues(steps) {
  steps.forEach((s, i) => { s.value = i; });
  return steps;
}

function migrateScale(scale) {
  if (!Array.isArray(scale) || scale.length < 2) return scale;
  const looksOld = scale[0].value > scale[scale.length - 1].value;
  if (looksOld) scale = [...scale].reverse();
  return recalcScaleValues(cloneScale(scale));
}

export const Store = {
  // ---- Profiles ----
  getProfiles() { return load().profiles; },
  getProfile(id) { return load().profiles.find(p => p.id === id) || null; },
  createProfile({ name, pronouns, color, emoji }) {
    const data = load();
    const profile = {
      id: uid(),
      name: name || "Unnamed",
      pronouns: pronouns || "",
      color: color || randomColor(),
      emoji: emoji || randomEmoji(),
      createdAt: Date.now(),
    };
    data.profiles.push(profile);
    save(data);
    return profile;
  },
  updateProfile(id, patch) {
    const data = load();
    const p = data.profiles.find(p => p.id === id);
    if (!p) return null;
    Object.assign(p, patch);
    save(data);
    return p;
  },
  deleteProfile(id) {
    const data = load();
    data.profiles = data.profiles.filter(p => p.id !== id);
    data.results = data.results.filter(r => r.profileId !== id);
    save(data);
  },

  // ---- Results ----
  getResults() { return load().results; },
  getResultsForProfile(pid) { return load().results.filter(r => r.profileId === pid); },
  getResult(rid) { return load().results.find(r => r.id === rid) || null; },
  saveResult(result) {
    const data = load();
    const existing = result.id && data.results.find(r => r.id === result.id);
    if (existing) {
      Object.assign(existing, result, { updatedAt: Date.now() });
    } else {
      result.id = result.id || uid();
      result.createdAt = result.createdAt || Date.now();
      result.updatedAt = Date.now();
      data.results.push(result);
    }
    save(data);
    return result;
  },
  deleteResult(rid) {
    const data = load();
    data.results = data.results.filter(r => r.id !== rid);
    save(data);
  },

  // ---- Imports ----
  getImports() { return load().imports; },
  saveImport(imp) {
    const data = load();
    imp.id = imp.id || uid();
    imp.importedAt = Date.now();
    data.imports.push(imp);
    save(data);
    return imp;
  },
  deleteImport(id) {
    const data = load();
    data.imports = data.imports.filter(i => i.id !== id);
    save(data);
  },

  // ---- Default scale ----
  getScale() {
    const data = load();
    if (!Array.isArray(data.scale) || data.scale.length < 2) {
      data.scale = cloneScale(DEFAULT_SCALE);
      save(data);
    } else {
      const migrated = migrateScale(data.scale);
      if (JSON.stringify(migrated) !== JSON.stringify(data.scale)) {
        data.scale = migrated; save(data);
      }
    }
    return data.scale;
  },
  setScale(steps) {
    const data = load();
    data.scale = recalcScaleValues(cloneScale(steps));
    save(data);
    return data.scale;
  },
  resetScale() {
    const data = load();
    data.scale = cloneScale(DEFAULT_SCALE);
    save(data);
    return data.scale;
  },

  // ---- Per-map scale ----
  getResultScale(result) {
    if (!result || !Array.isArray(result.scale) || result.scale.length < 2) {
      return this.getScale();
    }
    const migrated = migrateScale(result.scale);
    if (JSON.stringify(migrated) !== JSON.stringify(result.scale)) {
      result.scale = migrated;
      const data = load();
      const r = data.results.find(x => x.id === result.id);
      if (r) { r.scale = migrated; save(data); }
    }
    return result.scale;
  },
  setResultScale(resultId, steps) {
    const data = load();
    const r = data.results.find(r => r.id === resultId);
    if (!r) return null;
    r.scale = recalcScaleValues(cloneScale(steps));
    r.updatedAt = Date.now();
    save(data);
    return r.scale;
  },

  // ---- Theme ----
  getTheme() {
    const data = load();
    return data.settings?.theme || "auto";
  },
  setTheme(t) {
    const data = load();
    data.settings = data.settings || {};
    data.settings.theme = t;
    save(data);
    return t;
  },

  // ---- Language ----
  getLang() {
    const data = load();
    return data.settings?.lang || null;
  },
  setLang(lang) {
    const data = load();
    data.settings = data.settings || {};
    data.settings.lang = lang;
    save(data);
  },

  // ---- Fabi mode ----
  getFabiMode() {
    const data = load();
    return !!data.settings?.fabiMode;
  },
  setFabiMode(on) {
    const data = load();
    data.settings = data.settings || {};
    data.settings.fabiMode = !!on;
    save(data);
    return !!on;
  },

  // ---- First-visit flag (for onboarding wizard) ----
  isFirstVisit() {
    const data = load();
    return !data.settings?.wizardSeen;
  },
  markWizardSeen() {
    const data = load();
    data.settings = data.settings || {};
    data.settings.wizardSeen = true;
    save(data);
  },

  // ---- Versioning helpers ----
  nextResultVersion(profileId, subject) {
    const subj = (subject || "").trim().toLowerCase();
    const siblings = load().results.filter(r =>
      r.profileId === profileId && (r.subject || "").trim().toLowerCase() === subj
    );
    if (!siblings.length) return 1;
    const maxV = siblings.reduce((m, r) => Math.max(m, r.version || 1), 0);
    return maxV + 1;
  },
  nextImportVersion(name, subject) {
    const n = (name || "").trim().toLowerCase();
    const s = (subject || "").trim().toLowerCase();
    const siblings = load().imports.filter(i =>
      (i.name || "").trim().toLowerCase() === n &&
      (i.subject || "").trim().toLowerCase() === s
    );
    if (!siblings.length) return 1;
    const maxV = siblings.reduce((m, i) => Math.max(m, i.version || 1), 0);
    return maxV + 1;
  },
  scaleHasData(key) {
    const data = load();
    const test = (slot) => Object.values(slot || {}).some(v => v && v.scale === key);
    for (const r of data.results) {
      for (const cat of Object.values(r.answers || {})) {
        if (test(cat)) return true;
        if (test(cat.__custom)) return true;
      }
    }
    for (const i of data.imports) {
      for (const cat of Object.values(i.answers || {})) {
        if (test(cat)) return true;
        if (test(cat.__custom)) return true;
      }
    }
    return false;
  },

  // ---- Wipe / backup ----
  wipe() { localStorage.removeItem(KEY); },
  exportAll() { return load(); },
  replaceAll(snapshot) {
    if (!snapshot || typeof snapshot !== "object") throw new Error("Invalid backup file.");
    const safe = {
      profiles: Array.isArray(snapshot.profiles) ? snapshot.profiles : [],
      results:  Array.isArray(snapshot.results)  ? snapshot.results  : [],
      imports:  Array.isArray(snapshot.imports)  ? snapshot.imports  : [],
      settings: typeof snapshot.settings === "object" ? snapshot.settings : { theme: "auto" },
      scale:    Array.isArray(snapshot.scale)    ? migrateScale(snapshot.scale) : cloneScale(DEFAULT_SCALE),
    };
    localStorage.setItem(KEY, JSON.stringify(safe));
  },
};

const PALETTE = [
  "#7c3aed", "#06b6d4", "#ec4899", "#10b981", "#f59e0b",
  "#ef4444", "#3b82f6", "#a78bfa", "#22c55e", "#e11d48",
];
const EMOJI = ["🌷","🌻","🌊","🌙","🔥","🌿","✨","🪐","🍀","🦋","🪷","🍑","🌸","🌞"];

function randomColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}
function randomEmoji() {
  return EMOJI[Math.floor(Math.random() * EMOJI.length)];
}
