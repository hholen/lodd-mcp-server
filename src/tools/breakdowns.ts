import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryAnalytics } from "../db.js";
import { resolveSiteId } from "../resolve-site.js";
import { parsePeriod } from "../date-ranges.js";
import { filterFields, pickFilters } from "../filters.js";
import { slim } from "../slim.js";

export function registerBreakdownTools(server: McpServer) {
  server.tool(
    "get_pages",
    "Get pages ranked by traffic. Call twice with different periods to compare page performance over time. Optionally filter by URL path and/or segment by country, browser, os, device type, UTM source, or referrer. Returns page titles when available.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max results (1-1000)"),
      url_contains: z.string().optional().describe("Filter pages containing this path segment, e.g. '/blog'"),
      filter_country: z.string().optional().describe("2-letter country code (e.g. 'US')"),
      filter_browser: z.string().optional().describe("Browser substring match (e.g. 'Chrome')"),
      filter_os: z.string().optional().describe("OS substring match (e.g. 'iOS')"),
      filter_device_type: z.string().optional().describe("Device type: 'desktop' | 'mobile' | 'tablet'"),
      filter_utm_source: z.string().optional().describe("Exact UTM source (e.g. 'twitter')"),
      filter_referrer_contains: z.string().optional().describe("Referrer substring (e.g. 'google')"),
    },
    async ({ site, period, limit, url_contains, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);

      const data = await queryAnalytics({
        site_id: siteId, type: "top_pages",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
        url_pattern: url_contains || null,
        filter_country: filters.filter_country || null,
        filter_browser: filters.filter_browser || null,
        filter_os: filters.filter_os || null,
        filter_device_type: filters.filter_device_type || null,
        filter_utm_source: filters.filter_utm_source || null,
        filter_referrer_contains: filters.filter_referrer_contains || null,
      });
      const pagesMap = { page_title: "title", page_views: "views", unique_visitors: "visitors", average_duration: "avg_duration" };
      return { content: [{ type: "text", text: JSON.stringify(slim(data as any[], pagesMap)) }] };
    }
  );

  server.tool(
    "get_traffic_sources",
    "Get traffic sources: referrers, trackable links, and UTM campaigns combined. Shows where visitors are coming from. Call twice with different periods to compare source mix over time. Optional filters segment by country, browser, os, device type, UTM source, or referrer.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max results (1-1000)"),
      ...filterFields,
    },
    async ({ site, period, limit, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const data = await queryAnalytics({
        site_id: siteId, type: "combined_sources",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
        ...filterQuery,
      });
      const sourcesMap = { page_views: "views", unique_visitors: "visitors", click_count: "clicks" };
      return { content: [{ type: "text", text: JSON.stringify(slim(data as any[], sourcesMap)) }] };
    }
  );

  server.tool(
    "get_countries",
    "Get visitor geography breakdown by country. Call twice with different periods (e.g. '2026-04-01..2026-04-07' vs '2026-04-08..2026-04-14') to compare growth across countries. Optional filters segment by browser, os, device type, UTM source, or referrer.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max results (1-1000)"),
      filter_browser: z.string().optional().describe("Browser substring match (e.g. 'Chrome')"),
      filter_os: z.string().optional().describe("OS substring match (e.g. 'iOS')"),
      filter_device_type: z.string().optional().describe("Device type: 'desktop' | 'mobile' | 'tablet'"),
      filter_utm_source: z.string().optional().describe("Exact UTM source (e.g. 'twitter')"),
      filter_referrer_contains: z.string().optional().describe("Referrer substring (e.g. 'google')"),
    },
    async ({ site, period, limit, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const data = await queryAnalytics({
        site_id: siteId, type: "top_countries",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
        ...filterQuery,
      });
      const countriesMap = { page_views: "views", unique_visitors: "visitors" };
      return { content: [{ type: "text", text: JSON.stringify(slim(data as any[], countriesMap)) }] };
    }
  );

  server.tool(
    "get_tech_breakdown",
    "Get browser, operating system, and device type distribution in one call. Optional filters segment by country, browser, os, device type, UTM source, or referrer.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max results per category (1-1000)"),
      ...filterFields,
    },
    async ({ site, period, limit, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const safeLimit = Math.min(Math.max(limit, 1), 1000);
      const filterQuery = pickFilters(filters);

      const params = {
        site_id: siteId,
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString(),
        limit: safeLimit,
        ...filterQuery,
      };

      const [browsers, os, devices] = await Promise.all([
        queryAnalytics({ ...params, type: "top_browsers" }),
        queryAnalytics({ ...params, type: "top_operating_systems" }),
        queryAnalytics({ ...params, type: "device_types" }),
      ]);

      const techMap = { page_views: "views", unique_visitors: "visitors", device_type: "device" };
      const result = { browsers: slim(browsers as any[], techMap), operating_systems: slim(os as any[], techMap), devices: slim(devices as any[], techMap) };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_entry_exit_pages",
    "Get entry pages (where sessions start) and exit pages (where sessions end). Shows which pages attract new visits and where users leave. Useful for identifying effective landing pages and high-exit pages that may need improvement. Optional filters segment by country, browser, os, device type, UTM source, or referrer.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max results (1-1000)"),
      ...filterFields,
    },
    async ({ site, period, limit, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const data = await queryAnalytics({
        site_id: siteId, type: "entry_exit_pages",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
        ...filterQuery,
      });
      const entryExitMap = { page_views: "views", unique_visitors: "visitors" };
      return { content: [{ type: "text", text: JSON.stringify(slim(data as any[], entryExitMap)) }] };
    }
  );

  server.tool(
    "get_bot_report",
    "Show bot and crawler traffic that's been filtered from analytics. Groups by user agent, showing sessions, page views, countries, and first/last seen. Useful for understanding what's crawling your site (AI crawlers, search engines, SEO tools).",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max results (1-1000)"),
    },
    async ({ site, period, limit }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId, type: "bot_report",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );
}
