import { z } from "zod";

export const filterFields = {
  filter_country: z.string().optional().describe("2-letter country code (e.g. 'US')"),
  filter_browser: z.string().optional().describe("Browser substring match (e.g. 'Chrome')"),
  filter_os: z.string().optional().describe("OS substring match (e.g. 'iOS')"),
  filter_device_type: z.string().optional().describe("Device type: 'desktop' | 'mobile' | 'tablet'"),
  filter_utm_source: z.string().optional().describe("Exact UTM source (e.g. 'twitter')"),
  filter_referrer_contains: z.string().optional().describe("Referrer substring (e.g. 'google')"),
};

export function pickFilters(input: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  if (input.filter_country) out.filter_country = input.filter_country;
  if (input.filter_browser) out.filter_browser = input.filter_browser;
  if (input.filter_os) out.filter_os = input.filter_os;
  if (input.filter_device_type) out.filter_device_type = input.filter_device_type;
  if (input.filter_utm_source) out.filter_utm_source = input.filter_utm_source;
  if (input.filter_referrer_contains) out.filter_referrer_contains = input.filter_referrer_contains;
  return out;
}
