/*
 * Atelier React — theme/customizer runtime logic (the pure DOM + storage layer).
 * Theme restore + the customizer registry, in one module.
 *
 * Every mutation:
 *   - sets a data-at-* attribute on <html>,
 *   - persists/clears the matching at: localStorage key (default removes BOTH),
 *   - dispatches `at:change` so the chart wrapper re-themes live.
 *
 * CSS reacts purely to the <html> attributes. Never changes a token value —
 * only flips the attribute contract per BUILD-CONVENTIONS §4.
 */
import * as store from './storage';

const D = document.documentElement;

/* ── attribute ↔ key ↔ default registry (BUILD-CONVENTIONS §4, customizer.js) ── */
export interface RegEntry {
  attr: string;
  key: string;
  def: string;
}
/*
 * `preset` (colour) and `typeset` (typography) are two INDEPENDENT axes. They
 * used to be one: a preset block in _themes.css carried the palette and both
 * font families, so there was no way to take a scheme's colour without its
 * type. Typography now lives in _typography.css under data-at-type-preset and
 * composes freely with any scheme. Both default to 'atelier' and both follow
 * the same convention — the default writes no attribute and stores no key.
 *
 * typeset needs no bespoke setter: setByName() below already does exactly the
 * remove-on-default / set-otherwise dance it wants. setPreset is the odd one
 * out only because it also re-runs applyPreset().
 */
export const REGISTRY: Record<string, RegEntry> = {
  preset: { attr: 'data-at-theme-preset', key: 'theme-preset', def: 'atelier' },
  typeset: { attr: 'data-at-type-preset', key: 'type-preset', def: 'atelier' },
  mode: { attr: 'data-at-theme', key: 'theme', def: 'light' }, // resolved written, not stored raw
  dir: { attr: 'dir', key: 'dir', def: 'ltr' }, // computed from lang if absent
  sidebarStyle: { attr: 'data-at-sidebar-style', key: 'sidebar-style', def: 'default' },
  menu: { attr: 'data-at-menu', key: 'menu', def: 'click' },
  page: { attr: 'data-at-page', key: 'page', def: 'regular' },
  width: { attr: 'data-at-width', key: 'width', def: 'fluid' },
  headerPosition: { attr: 'data-at-header-position', key: 'header-position', def: 'fixed' },
  sidebarPosition: { attr: 'data-at-sidebar-position', key: 'sidebar-position', def: 'fixed' },
  headerScheme: { attr: 'data-at-header', key: 'header-scheme', def: 'light' },
};

/* The 12 colour schemes (spec 01). The default `atelier` writes NO attribute —
   the others all set `data-at-theme-preset`. COLOUR ONLY: these tiles used to
   swap the fonts too, which is why TYPESETS below exists as a separate axis.
   Swatches are the scheme's LIGHT canvas / ink / accent / secondary, hardcoded
   because the chip has to show a theme that is not the active one. Keep them in
   step with styles/tokens/_themes.css (Atelier lives on :root in _roles.css). */
export interface Preset {
  value: string;
  label: string;
  bg: string;
  ink: string;
  bars: string[];
}
export const PRESETS: Preset[] = [
  { value: 'atelier', label: 'Atelier', bg: '#f3ebda', ink: '#2e2317', bars: ['#2e2317', '#ff946f', '#ce9a38'] },
  { value: 'electric', label: 'Electric', bg: '#efede3', ink: '#0a0a0a', bars: ['#0a0a0a', '#ff8cb8', '#ffd60a'] },
  { value: 'sage', label: 'Sage', bg: '#eef1ea', ink: '#1f2a1f', bars: ['#1f2a1f', '#f79690', '#d4a943'] },
  { value: 'violet', label: 'Violet', bg: '#efeaf5', ink: '#2a1f3d', bars: ['#2a1f3d', '#944abc', '#fba834'] },
  { value: 'lagoon', label: 'Lagoon', bg: '#e8f1f2', ink: '#0a2730', bars: ['#0a2730', '#00c4c5', '#f2b705'] },
  { value: 'foundry', label: 'Foundry', bg: '#f7efe3', ink: '#2b1f14', bars: ['#2b1f14', '#ff963c', '#f0b429'] },
  { value: 'stencil', label: 'Stencil', bg: '#e0d5bd', ink: '#1c1509', bars: ['#1c1509', '#475c00', '#e0a02a'] },
  { value: 'gantry', label: 'Gantry', bg: '#c9d3dd', ink: '#0e1418', bars: ['#0e1418', '#0268ea', '#ffa41b'] },
  { value: 'lacquer', label: 'Lacquer', bg: '#eee4e3', ink: '#25121a', bars: ['#25121a', '#006c4f', '#b8801c'] },
  { value: 'nocturne', label: 'Nocturne', bg: '#e3e8f2', ink: '#0c1524', bars: ['#0c1524', '#50cbff', '#c45ff0'] },
  { value: 'primer', label: 'Primer', bg: '#f3e0c6', ink: '#09203d', bars: ['#09203d', '#235897', '#f5c25e'] },
  { value: 'sorbet', label: 'Sorbet', bg: '#fdf0f4', ink: '#2b1630', bars: ['#2b1630', '#fc85f0', '#fec89a'] },
];

/* The 12 type sets — the second axis, independent of the colour schemes above.
   `atelier` writes NO attribute (its pair is inline on :root in _roles.css);
   every other set writes `data-at-type-preset`.

   Each row in the customizer is a real specimen: the Ag sample and BOTH family
   names render in the faces that row applies, so the pick is made by eye. That
   is what `display`/`body` are for — a row has to render a set that is not the
   active one, the same reason the swatches above are hardcoded hexes. Every
   family is already in the single Google Fonts request in the document head, so
   nothing here loads on demand. `displayName`/`bodyName` are the shortened
   labels the row shows; `aria` carries the full family names. Keep in step with
   styles/tokens/_typography.css. */
export interface Typeset {
  value: string;
  label: string;
  display: string;
  displayName: string;
  body: string;
  bodyName: string;
  aria: string;
}
export const TYPESETS: Typeset[] = [
  {
    value: 'atelier',
    label: 'Atelier',
    display: "'Fraunces',Georgia,serif",
    displayName: 'Fraunces',
    body: "'Libre Franklin',system-ui,sans-serif",
    bodyName: 'Libre Franklin',
    aria: 'Atelier typography — Fraunces and Libre Franklin',
  },
  {
    value: 'electric',
    label: 'Electric',
    display: "'Archivo','Arial Black',sans-serif",
    displayName: 'Archivo',
    body: "'Instrument Sans',system-ui,sans-serif",
    bodyName: 'Instrument Sans',
    aria: 'Electric typography — Archivo and Instrument Sans',
  },
  {
    value: 'sage',
    label: 'Sage',
    display: "'Bricolage Grotesque',system-ui,sans-serif",
    displayName: 'Bricolage',
    body: "'Manrope',system-ui,sans-serif",
    bodyName: 'Manrope',
    aria: 'Sage typography — Bricolage Grotesque and Manrope',
  },
  {
    value: 'violet',
    label: 'Violet',
    display: "'Sora',system-ui,sans-serif",
    displayName: 'Sora',
    body: "'Manrope',system-ui,sans-serif",
    bodyName: 'Manrope',
    aria: 'Violet typography — Sora and Manrope',
  },
  {
    value: 'lagoon',
    label: 'Lagoon',
    display: "'Outfit',system-ui,sans-serif",
    displayName: 'Outfit',
    body: "'Figtree',system-ui,sans-serif",
    bodyName: 'Figtree',
    aria: 'Lagoon typography — Outfit and Figtree',
  },
  {
    value: 'foundry',
    label: 'Foundry',
    display: "'Saira',system-ui,sans-serif",
    displayName: 'Saira',
    body: "'IBM Plex Sans',system-ui,sans-serif",
    bodyName: 'IBM Plex Sans',
    aria: 'Foundry typography — Saira and IBM Plex Sans',
  },
  {
    value: 'stencil',
    label: 'Stencil',
    display: "'Antonio','Arial Narrow',sans-serif",
    displayName: 'Antonio',
    body: "'Public Sans',system-ui,sans-serif",
    bodyName: 'Public Sans',
    aria: 'Stencil typography — Antonio and Public Sans',
  },
  {
    value: 'gantry',
    label: 'Gantry',
    display: "'Oxanium',system-ui,sans-serif",
    displayName: 'Oxanium',
    body: "'IBM Plex Sans',system-ui,sans-serif",
    bodyName: 'IBM Plex Sans',
    aria: 'Gantry typography — Oxanium and IBM Plex Sans',
  },
  {
    value: 'lacquer',
    label: 'Lacquer',
    display: "'Playfair Display',Georgia,serif",
    displayName: 'Playfair',
    body: "'DM Sans',system-ui,sans-serif",
    bodyName: 'DM Sans',
    aria: 'Lacquer typography — Playfair Display and DM Sans',
  },
  {
    value: 'nocturne',
    label: 'Nocturne',
    display: "'Chivo',system-ui,sans-serif",
    displayName: 'Chivo',
    body: "'Mulish',system-ui,sans-serif",
    bodyName: 'Mulish',
    aria: 'Nocturne typography — Chivo and Mulish',
  },
  {
    value: 'primer',
    label: 'Primer',
    display: "'Zilla Slab',Georgia,serif",
    displayName: 'Zilla Slab',
    body: "'Public Sans',system-ui,sans-serif",
    bodyName: 'Public Sans',
    aria: 'Primer typography — Zilla Slab and Public Sans',
  },
  {
    value: 'sorbet',
    label: 'Sorbet',
    display: "'Gabarito',system-ui,sans-serif",
    displayName: 'Gabarito',
    body: "'Plus Jakarta Sans',system-ui,sans-serif",
    bodyName: 'Plus Jakarta',
    aria: 'Sorbet typography — Gabarito and Plus Jakarta Sans',
  },
];

/* ── system theme ── */
function systemDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}
export function resolveTheme(theme?: string): 'light' | 'dark' {
  const t = theme ?? store.get('theme') ?? 'light';
  if (t === 'system') return systemDark() ? 'dark' : 'light';
  return t === 'dark' ? 'dark' : 'light';
}
export function resolvedMode(): 'light' | 'dark' {
  return resolveTheme(store.get('theme') || 'light');
}

export function applyTheme(): 'light' | 'dark' {
  const resolved = resolvedMode();
  D.setAttribute('data-at-theme', resolved);
  return resolved;
}

export function applyPreset(): string {
  const preset = store.get('theme-preset') || 'atelier';
  if (preset === 'atelier') D.removeAttribute('data-at-theme-preset');
  else D.setAttribute('data-at-theme-preset', preset);
  return preset;
}

/* Typography is a separate axis from the colour scheme above — same default
   convention (atelier is inline on :root and writes no attribute). spec 04 §2b */
export function applyTypeset(): string {
  const typeset = store.get('type-preset') || 'atelier';
  if (typeset === 'atelier') D.removeAttribute('data-at-type-preset');
  else D.setAttribute('data-at-type-preset', typeset);
  return typeset;
}

/** Write attr + key; selecting the default removes BOTH. */
function apply(attr: string, key: string, val: string, def: string): void {
  if (val === def) {
    D.removeAttribute(attr);
    store.remove(key);
  } else {
    D.setAttribute(attr, val);
    store.set(key, val);
  }
}

export function setByName(name: string, value: string): void {
  const reg = REGISTRY[name];
  if (!reg) return;
  apply(reg.attr, reg.key, value, reg.def);
  // Collapse applies to the Default style only — Compact/Expand lock fixed
  // geometry and the flag would leak in (it makes Expand render as a rail).
  // Re-derived exactly the way the anti-flash IIFE does, so returning to
  // Default restores the rail; the '0' opt-out stays in storage so the
  // reader's choice survives the round trip.
  if (name === 'sidebarStyle') {
    if (value === 'default' && store.get('collapsed') !== '0')
      D.setAttribute('data-at-collapsed', 'true');
    else D.removeAttribute('data-at-collapsed');
  }
  store.announceChange({ [name]: value });
}

export function setPreset(preset: string): void {
  if (preset === 'atelier') {
    D.removeAttribute('data-at-theme-preset');
    store.remove('theme-preset');
  } else {
    D.setAttribute('data-at-theme-preset', preset);
    store.set('theme-preset', preset);
  }
  applyPreset();
  store.announceChange({ preset });
}

export function setMode(mode: string): 'light' | 'dark' {
  store.set('theme', mode);
  const resolved = applyTheme();
  store.announceChange({ mode, resolved });
  return resolved;
}

/** Header quick-toggle: flip light↔dark only. */
export function quickToggleTheme(): 'light' | 'dark' {
  const cur = D.getAttribute('data-at-theme') === 'dark' ? 'dark' : 'light';
  return setMode(cur === 'dark' ? 'light' : 'dark');
}

export function setDir(dir: string): void {
  D.setAttribute('dir', dir);
  store.set('dir', dir);
  store.announceChange({ dir });
}

export function setLang(code: string): void {
  const lang = (code || 'EN').toUpperCase();
  store.set('lang', lang);
  D.setAttribute('lang', lang.toLowerCase());
  const dirStored = store.get('dir');
  if (!dirStored) D.setAttribute('dir', lang === 'AR' ? 'rtl' : 'ltr');
  store.announceChange({ lang });
}

/** Read the current resolved value of a control (registry/theme/dir aware). */
export function currentValueOf(name: string): string {
  if (name === 'mode' || name === 'theme') return store.get('theme') || 'light';
  if (name === 'dir') return D.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr';
  if (name === 'lang') return store.get('lang') || 'EN';
  if (name === 'preset') return store.get('theme-preset') || 'atelier';
  if (name === 'typeset') return store.get('type-preset') || 'atelier';
  const r = REGISTRY[name];
  return r ? (D.getAttribute(r.attr) || r.def) : '';
}

export function reset(): void {
  Object.keys(REGISTRY).forEach((name) => {
    if (name === 'mode') setMode('light');
    else if (name === 'preset') setPreset('atelier');
    else if (name === 'dir') setDir('ltr');
    else setByName(name, REGISTRY[name].def);
  });
  // The rail is the default, so reset restores it and drops the stored opt-out.
  D.setAttribute('data-at-collapsed', 'true');
  store.remove('collapsed');
  store.announceChange({ reset: true });
}

/** Snapshot current state for the controls to mirror. */
export interface Snapshot {
  preset: string;
  typeset: string;
  mode: string;
  resolved: 'light' | 'dark';
  dir: string;
  sidebarStyle: string;
  menu: string;
  page: string;
  width: string;
  headerPosition: string;
  sidebarPosition: string;
  headerScheme: string;
}
export function snapshot(): Snapshot {
  return {
    preset: store.get('theme-preset') || 'atelier',
    typeset: store.get('type-preset') || 'atelier',
    mode: store.get('theme') || 'light',
    resolved: resolvedMode(),
    dir: currentValueOf('dir'),
    sidebarStyle: store.get('sidebar-style') || 'default',
    menu: store.get('menu') || 'click',
    page: store.get('page') || 'regular',
    width: store.get('width') || 'fluid',
    headerPosition: store.get('header-position') || 'fixed',
    sidebarPosition: store.get('sidebar-position') || 'fixed',
    headerScheme: store.get('header-scheme') || 'light',
  };
}

/** Boot: re-sync from storage (the anti-flash IIFE has already painted). */
export function bootTheme(): void {
  applyTheme();
  applyPreset();
  applyTypeset();
}

/* ── live system listener (only mutates while pref === 'system') ── */
let _mql: MediaQueryList | null = null;
export function listenSystem(): void {
  if (_mql) return;
  try {
    _mql = window.matchMedia('(prefers-color-scheme: dark)');
  } catch {
    return;
  }
  const onChange = (): void => {
    if ((store.get('theme') || 'light') !== 'system') return;
    const resolved = applyTheme();
    window.dispatchEvent(new CustomEvent('at:change', { detail: { mode: resolved } }));
  };
  if (_mql.addEventListener) _mql.addEventListener('change', onChange);
}
