import { queryAnalytics } from "./db.js";
import type { Site } from "./types.js";

// Cache resolved sites for the session
const siteCache = new Map<string, Site>();

/**
 * Resolve a site reference (domain or UUID) to a site ID.
 * Uses the analytics edge function which handles API key auth.
 */
export async function resolveSiteId(siteRef: string): Promise<string> {
  const cached = siteCache.get(siteRef);
  if (cached) return cached.id;

  // If it looks like a UUID, use it directly
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(siteRef);
  if (isUUID) {
    return siteRef;
  }

  // For domain references, use the resolve_site endpoint
  const normalizedDomain = siteRef.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");

  let site: Site;
  try {
    site = await queryAnalytics({
      type: "resolve_site",
      domain: normalizedDomain,
    }) as Site;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      throw new Error(`Site "${siteRef}" not found. Use list_sites to see your available sites.`);
    }
    throw err;
  }

  siteCache.set(siteRef, site);
  siteCache.set(site.id, site);
  if (site.domain) siteCache.set(site.domain, site);

  return site.id;
}
