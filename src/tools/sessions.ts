import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryAnalytics, withUsageWarning } from "../db.js";
import { resolveSiteId } from "../resolve-site.js";
import { parsePeriod } from "../date-ranges.js";
import { filterFields, pickFilters } from "../filters.js";

export function registerSessionTools(server: McpServer) {
  server.tool(
    "get_session_paths",
    "Find the most common page sequences visitors follow. Returns paths like '/blog → /pricing → /signup' with session counts. Useful for understanding navigation patterns and identifying the most common journeys to conversion.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max paths to return (1-1000)"),
      min_sessions: z.number().default(2).describe("Minimum sessions for a path to appear"),
      max_steps: z.number().default(10).describe("Maximum pages per path (2-20)"),
      ...filterFields,
    },
    async ({ site, period, limit, min_sessions, max_steps, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const data = await queryAnalytics({
        site_id: siteId,
        type: "session_paths",
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
        min_sessions: Math.max(min_sessions, 1),
        max_steps: Math.min(Math.max(max_steps, 2), 20),
        ...filterQuery,
      });
      return withUsageWarning([{ type: "text" as const, text: JSON.stringify(data) }]);
    }
  );

  server.tool(
    "get_dropoff_destinations",
    "Given a URL, show where visitors go next or if they leave the site. Useful for understanding why people leave key pages like /pricing. The '(exited)' row means the session ended after viewing that page.",
    {
      site: z.string().describe("Site domain or UUID"),
      from_url: z.string().describe("URL path to analyze (e.g. '/pricing'). Substring match."),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max destinations to return"),
      ...filterFields,
    },
    async ({ site, from_url, period, limit, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const data = await queryAnalytics({
        site_id: siteId,
        type: "dropoff_destinations",
        from_url,
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
        ...filterQuery,
      });
      return withUsageWarning([{ type: "text" as const, text: JSON.stringify(data) }]);
    }
  );

  server.tool(
    "get_session_scores",
    "Classify sessions into engagement buckets: bounced (1 page), browsed (2-3 pages), engaged (4+ pages or event fired), converted (conversion event fired). Optionally specify which event defines 'converted'.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      conversion_event: z.string().optional().describe("Event name for 'converted' bucket (e.g. 'signup_complete'). If omitted, any event = converted."),
      ...filterFields,
    },
    async ({ site, period, conversion_event, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const data = await queryAnalytics({
        site_id: siteId,
        type: "session_scores",
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString(),
        conversion_event: conversion_event || null,
        ...filterQuery,
      });
      return withUsageWarning([{ type: "text" as const, text: JSON.stringify(data) }]);
    }
  );

  server.tool(
    "get_event_sequences",
    "Given a target event (like 'signup_complete'), find what actions typically precede it. Shows both pageviews and events before the target, ranked by frequency. step_position=1 is immediately before the target event.",
    {
      site: z.string().describe("Site domain or UUID"),
      target_event: z.string().describe("The event to analyze (e.g. 'signup_complete')"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max results"),
      lookback_steps: z.number().default(5).describe("How many steps back to look (1-10)"),
      ...filterFields,
    },
    async ({ site, target_event, period, limit, lookback_steps, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const data = await queryAnalytics({
        site_id: siteId,
        type: "event_sequences",
        target_event,
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
        lookback_steps: Math.min(Math.max(lookback_steps, 1), 10),
        ...filterQuery,
      });
      return withUsageWarning([{ type: "text" as const, text: JSON.stringify(data) }]);
    }
  );

  server.tool(
    "get_content_groups",
    "Group pages by URL pattern and get aggregate metrics per group. Useful for comparing how blog vs docs vs app pages perform. Patterns use SQL LIKE syntax where % matches anything.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      groups: z.array(
        z.object({
          label: z.string().describe("Display name (e.g. 'Blog')"),
          pattern: z.string().describe("URL LIKE pattern (e.g. '/blog/%')"),
        })
      ).min(1).describe("Groups to analyze"),
      ...filterFields,
    },
    async ({ site, period, groups, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const data = await queryAnalytics({
        site_id: siteId,
        type: "content_groups",
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString(),
        groups: JSON.stringify(groups),
        ...filterQuery,
      });
      return withUsageWarning([{ type: "text" as const, text: JSON.stringify(data) }]);
    }
  );
}
