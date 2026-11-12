/*
 * Atelier React — at: localStorage helper, schema-guarded, never throws.
 * Spec 04 §5.
 */
export const PREFIX = 'at:';
const SCHEMA_KEY = PREFIX + 'schema';
/* v2 split typography off the colour preset into its own `type-preset` key.
   Must stay in step with the anti-flash IIFE in the document head — it runs
   first and stamps this same version, so a stale constant here would read the
   IIFE's own write as an unknown shape and wipe every preference. */
const SCHEMA_VERSION = '2';

export function get(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function set(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    /* storage may be blocked; fail silently */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* noop */
  }
}

export function ensureSchema(): void {
  try {
    const schema = get('schema');
    if (schema && schema !== SCHEMA_VERSION) {
      /* A v1 install picked ONE name for both axes, so carry that name across
         as the type set — otherwise upgrading silently drops every non-Atelier
         user back to Fraunces. Migrating instead of wiping also keeps their
         layout prefs. Any other shape is still wiped, as before. */
      if (schema === '1') {
        const v1preset = get('theme-preset');
        if (v1preset && !get('type-preset')) set('type-preset', v1preset);
      } else {
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.indexOf(PREFIX) === 0) toRemove.push(k);
        }
        toRemove.forEach((k) => localStorage.removeItem(k));
      }
    }
    set('schema', SCHEMA_VERSION);
    // raw schema marker key for parity with the IIFE's at:schema read
    try {
      localStorage.setItem(SCHEMA_KEY, SCHEMA_VERSION);
    } catch {
      /* noop */
    }
  } catch {
    /* noop */
  }
}

/** Dispatch at:change so charts/customizer react. spec 04 §4 */
export function announceChange(detail: Record<string, unknown> = {}): void {
  window.dispatchEvent(new CustomEvent('at:change', { detail }));
}
