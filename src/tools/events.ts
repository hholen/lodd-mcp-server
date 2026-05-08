import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryAnalytics } from "../db.js";
import { resolveSiteId } from "../resolve-site.js";
import { parsePeriod } from "../date-ranges.js";
import { filterFields, pickFilters } from "../filters.js";
import { slim } from "../slim.js";

export function registerEventTools(server: McpServer) {
  server.tool(
    "get_event_counts",
    "Get a summary of all custom events tracked on a site, showing event names with their total count and unique sessions. Optionally segment by country, browser, os, device type, UTM source, or referrer (matched against the session's page views).",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      filter_country: z.string().optional().describe("2-letter country code (e.g. 'US')"),
      filter_browser: z.string().optional().describe("Browser substring match (e.g. 'Chrome')"),
      filter_os: z.string().optional().describe("OS substring match (e.g. 'iOS')"),
      filter_device_type: z.string().optional().describe("Device type: 'desktop' | 'mobile' | 'tablet'"),
      filter_utm_source: z.string().optional().describe("Exact UTM source (e.g. 'twitter')"),
      filter_referrer_contains: z.string().optional().describe("Referrer substring (e.g. 'google')"),
    },
    async ({ site, period, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId, type: "event_counts",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        filter_country: filters.filter_country || null,
        filter_browser: filters.filter_browser || null,
        filter_os: filters.filter_os || null,
        filter_device_type: filters.filter_device_type || null,
        filter_utm_source: filters.filter_utm_source || null,
        filter_referrer_contains: filters.filter_referrer_contains || null,
      });
      const eventCountsMap = { unique_sessions: "sessions" };
      return { content: [{ type: "text", text: JSON.stringify(slim(data as Record<string, unknown>[], eventCountsMap)) }] };
    }
  );

  server.tool(
    "get_events",
    "Get individual custom event records with their properties. Optionally filter by event name.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      event_name: z.string().optional().describe("Filter to a specific event name"),
      limit: z.number().default(100).describe("Max results (1-1000)"),
    },
    async ({ site, period, event_name, limit }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId, type: "events",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        event_name: event_name || null,
        limit: Math.min(Math.max(limit, 1), 1000),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "get_event_timeseries",
    "Get event counts bucketed over time for a specific event. Useful for seeing how event frequency changes. Optional filters segment by country, browser, os, device type, UTM source, or referrer (matched against the session's page views).",
    {
      site: z.string().describe("Site domain or UUID"),
      event_name: z.string().describe("The event name to get timeseries for"),
      period: z.string().default("30d").describe("Time period"),
      interval: z.enum(["hour", "day"]).optional().describe("Bucket interval"),
      ...filterFields,
    },
    async ({ site, event_name, period, interval, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const data = await queryAnalytics({
        site_id: siteId, type: "event_timeseries",
        event_name,
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        interval: interval || range.interval,
        ...filterQuery,
      });
      const eventTsMap = { date_label: "date" };
      return { content: [{ type: "text", text: JSON.stringify(slim(data as Record<string, unknown>[], eventTsMap)) }] };
    }
  );
}
