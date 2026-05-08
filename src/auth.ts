export function hasApiKey(): boolean {
  return !!process.env.LODD_API_KEY;
}

export function getApiKey(): string {
  return process.env.LODD_API_KEY || "";
}

export function getApiUrl(): string {
  return process.env.LODD_API_URL || "https://api.lodd.dev";
}
