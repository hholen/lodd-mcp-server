import { getRequestContext } from "./request-context.js";

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function getApiKey(): string {
  return getRequestContext()?.apiKey || process.env.LODD_API_KEY || "";
}

export function getApiUrl(): string {
  return getRequestContext()?.apiUrl || process.env.LODD_API_URL || "https://api.lodd.dev";
}
