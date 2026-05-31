import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request context for the hosted (HTTP) MCP transport.
 *
 * The stdio transport sets a single API key in the process environment for the
 * lifetime of the process, which is correct because one stdio server serves one
 * user. The hosted transport (api/mcp.ts on Vercel) serves many users from one
 * process, and under Fluid Compute multiple requests run concurrently in that
 * process. Storing the per-request key anywhere process-global (e.g. process.env)
 * lets one request's key bleed into another's tool calls. AsyncLocalStorage gives
 * each request its own isolated store that survives across awaits.
 */
export interface RequestContext {
  apiKey?: string;
  apiUrl?: string;
  /** Mutated during a request when the analytics API returns a usage warning. */
  usageWarning?: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Run `fn` with an isolated request context. The store is fresh per call. */
export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run({ ...ctx }, fn);
}

/** The current request's context, or undefined on the stdio path. */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}
