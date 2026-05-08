import { getApiUrl, getApiKey } from "./auth.js";
import { getClientInfo } from "./client-info.js";

export function getConfig(): { baseUrl: string; apiKey: string } {
  return { baseUrl: getApiUrl(), apiKey: getApiKey() };
}

function clientHeader(): Record<string, string> {
  const info = getClientInfo();
  return info ? { "X-MCP-Client": `${info.name}/${info.version}` } : {};
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
