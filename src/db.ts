import { getApiUrl, getApiKey } from "./auth.js";
import { getClientInfo } from "./client-info.js";
import { getRequestContext } from "./request-context.js";

export function getConfig(): { baseUrl: string; apiKey: string } {
  return { baseUrl: getApiUrl(), apiKey: getApiKey() };
}

function clientHeader(): Record<string, string> {
  const info = getClientInfo();
  return info ? { "X-MCP-Client": `${info.name}/${info.version}` } : {};
}

// Fallback for the stdio path, where there is no per-request AsyncLocalStorage
// context (one process serves one user). On the hosted path the warning is
// stored per-request in the context so it can't bleed across concurrent users.
let _lastUsageWarning: string | null = null;

function setUsageWarning(warning: string | null): void {
  const ctx = getRequestContext();
  if (ctx) ctx.usageWarning = warning;
  else _lastUsageWarning = warning;
}

function getUsageWarning(): string | null {
  const ctx = getRequestContext();
  if (ctx) return ctx.usageWarning ?? null;
  return _lastUsageWarning;
}

function captureUsageHeaders(response: Response): void {
  const pct = parseInt(response.headers.get("X-Lodd-Usage-Percent") || "0", 10);
  if (pct >= 80) {
    const used = response.headers.get("X-Lodd-Usage-Used") || "?";
    const limit = response.headers.get("X-Lodd-Usage-Limit") || "?";
    setUsageWarning(pct >= 100
      ? `⚠️ Usage: ${used}/${limit} events (${pct}%). Tracking is paused. Upgrade at lodd.dev/account.`
      : `⚠️ Usage: ${used}/${limit} events (${pct}%). Upgrade at lodd.dev/account.`);
  } else {
    setUsageWarning(null);
  }
}

export function _setUsageWarningForTest(warning: string | null): void {
  setUsageWarning(warning);
}

export function withUsageWarning(content: { type: "text"; text: string }[]): { content: { type: "text"; text: string }[] } {
  const warning = getUsageWarning();
  if (warning) {
    return { content: [...content, { type: "text" as const, text: warning }] };
  }
  return { content };
}

export async function queryAnalytics(params: Record<string, string | number | null | undefined>): Promise<unknown> {
  const { baseUrl, apiKey } = getConfig();

  if (!apiKey) {
    throw new Error("No API key configured. Set LODD_API_KEY environment variable.");
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null) {
      searchParams.set(key, String(value));
    }
  }

  const url = `${baseUrl}/functions/v1/analytics?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...clientHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Analytics API error (${response.status}): ${error.error || response.statusText}`);
  }

  captureUsageHeaders(response);
  return response.json();
}

export async function callEdgeFunction(
  functionName: string,
  options: {
    method?: string;
    params?: Record<string, string | number | null | undefined>;
    body?: unknown;
  } = {}
): Promise<unknown> {
  const { baseUrl, apiKey } = getConfig();
  const { method = "GET", params, body } = options;

  if (!apiKey) {
    throw new Error("No API key configured. Set LODD_API_KEY environment variable.");
  }

  let url = `${baseUrl}/functions/v1/${functionName}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null) searchParams.set(key, String(value));
    }
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    "X-API-Key": apiKey,
    "Content-Type": "application/json",
    ...clientHeader(),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Edge function error (${response.status}): ${error.error || response.statusText}`);
  }

  return response.json();
}
