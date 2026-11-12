/*
 * Atelier React — sidebar drawer + collapse runtime.
 *
 * One hamburger, two behaviours split by viewport (matching the reference):
 *   ≤992px — the sidebar is an off-canvas drawer, revealed by `body.at-sidebar-open`
 *   >992px — the sidebar collapses to an icon rail via <html data-at-collapsed>
 *
 * The state deliberately lives on the DOM rather than in React state. The CSS
 * contract IS a body class plus an <html> attribute (base.css §13), and the
 * anti-flash IIFE in index.html already restores `data-at-collapsed` before React
 * mounts. Mirroring any of that into component state would only create a second
 * source of truth to keep in sync — and one that loses to the IIFE on first paint.
 */
import * as store from './storage';

/* Every DOM read is deferred into the function body rather than cached in a
   module-level `const D = document.documentElement`, so the module stays safe
   to evaluate where there is no document — a server-render pass, a unit test.
   Nothing here is
   called during render — only from effects and click handlers — so by the time
   any of it runs there is always a document. */
function html(): HTMLElement | null {
  return typeof document === 'undefined' ? null : document.documentElement;
}

/** The 992px breakpoint is the same one base.css §13 switches the drawer on. */
export function isMobile(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 992px)').matches;
}

export function isDrawerOpen(): boolean {
  return typeof document !== 'undefined' && document.body.classList.contains('at-sidebar-open');
}

export function openDrawer(): void {
  if (typeof document !== 'undefined') document.body.classList.add('at-sidebar-open');
}

export function closeDrawer(): void {
  if (typeof document !== 'undefined') document.body.classList.remove('at-sidebar-open');
}

export function isCollapsed(): boolean {
  return html()?.getAttribute('data-at-collapsed') === 'true';
}

/**
 * Desktop rail. Persisted to at:collapsed so it survives a reload.
 *
 * The rail is the DEFAULT state, so the stored flag is inverted against the
 * usual write-only-non-defaults rule: expanding writes '0' (the opt-out) and
 * collapsing clears the key. No key at all therefore means collapsed, which is
 * exactly what the anti-flash IIFE restores on a fresh install.
 */
export function toggleCollapsed(): void {
  const D = html();
  if (!D) return;
  if (isCollapsed()) {
    D.removeAttribute('data-at-collapsed');
    store.remove('collapsed');
  } else {
    D.setAttribute('data-at-collapsed', 'true');
    store.set('collapsed', '1');
  }
}

/** What the header hamburger calls: drawer on mobile, rail on desktop. */
export function toggleSidebar(): void {
  if (isMobile()) {
    if (isDrawerOpen()) closeDrawer();
    else openDrawer();
  } else {
    toggleCollapsed();
  }
}
