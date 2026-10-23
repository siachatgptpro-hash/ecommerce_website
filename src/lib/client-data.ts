/**
 * Deduped client-side fetches for site-chrome data.
 *
 * The Header, Footer, cart drawer, and auth pages all need the same
 * public settings / category list / policy links. Each used to fire its
 * own request on mount (3 identical /api/settings calls per page load).
 * These helpers share ONE in-flight/resolved promise per endpoint for
 * the whole SPA session — the chrome already mounts once per session in
 * the root layout, so behaviour is unchanged and the duplicate network
 * work (and its INP cost) disappears.
 *
 * Failures resolve to null/[] so callers keep their built-in fallbacks,
 * exactly like the previous per-component `.catch(() => {})` handling.
 */

export interface PublicSettings {
  storeName?: string;
  logoUrl?: string;
  announcementText?: string;
  gstin?: string;
  [key: string]: unknown;
}

let settingsPromise: Promise<PublicSettings | null> | null = null;
let categoriesPromise: Promise<unknown[]> | null = null;
let policyLinksPromise: Promise<unknown[]> | null = null;

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  return res.json();
}

export function getPublicSettings(): Promise<PublicSettings | null> {
  if (!settingsPromise) {
    settingsPromise = fetchJson('/api/settings')
      .then((json) => (json?.success && json.data ? (json.data as PublicSettings) : null))
      .catch(() => null);
  }
  return settingsPromise;
}

export function getCatalogueCategories(): Promise<unknown[]> {
  if (!categoriesPromise) {
    categoriesPromise = fetchJson('/api/catalog/categories')
      .then((json) => (json?.success && Array.isArray(json.data) ? json.data : []))
      .catch(() => []);
  }
  return categoriesPromise;
}

export function getFooterPolicyLinks(): Promise<unknown[]> {
  if (!policyLinksPromise) {
    policyLinksPromise = fetchJson('/api/policies')
      .then((json) => (Array.isArray(json?.data) ? json.data : []))
      .catch(() => []);
  }
  return policyLinksPromise;
}
