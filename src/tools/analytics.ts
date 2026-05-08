import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryAnalytics } from "../db.js";
import { resolveSiteId } from "../resolve-site.js";
import { parsePeriod, getPreviousPeriod } from "../date-ranges.js";
import { filterFields, pickFilters } from "../filters.js";
import { slim } from "../slim.js";
import type { AnalyticsData } from "../types.js";

export function registerAnalyticsTools(server: McpServer) {
  server.tool(
    "get_analytics",
    "Get aggregate analytics for a site (visitors, page views, bounce rate, etc.) with automatic comparison to the previous period. Returns average_duration in seconds. Optional filters segment the result by country, browser, os, device type, UTM source, or referrer.",
    {
      site: z.string().describe("Site domain (e.g. 'example.com') or UUID"),
      period: z.string().default("30d").describe("Time period: 'today', 'yesterday', '7d', '30d', '90d', or 'YYYY-MM-DD..YYYY-MM-DD'"),
      ...filterFields,
    },
    async ({ site, period, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const prevRange = getPreviousPeriod(range);
      const filterQuery = pickFilters(filters);

      const [current, previous] = await Promise.all([
        queryAnalytics({
          site_id: siteId, type: "analytics",
          start_date: range.start.toISOString(), end_date: range.end.toISOString(),
          ...filterQuery,
        }) as Promise<AnalyticsData>,
        queryAnalytics({
          site_id: siteId, type: "analytics",
          start_date: prevRange.start.toISOString(), end_date: prevRange.end.toISOString(),
          ...filterQuery,
        }) as Promise<AnalyticsData>,
      ]);

      const pctChange = (curr: number, prev: number) =>
        prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 1000) / 10;

      const analyticsMap = { total_page_views: "page_views", unique_visitors: "visitors", unique_countries: "countries", average_duration: "avg_duration" };
      const result = {
        site, period,
        filters: Object.keys(filterQuery).length > 0 ? filterQuery : undefined,
        current: slim(current as any, analyticsMap),
        previous: slim(previous as any, analyticsMap),
        changes: {
          visitors_pct: pctChange(current.unique_visitors, previous.unique_visitors),
          page_views_pct: pctChange(current.total_page_views, previous.total_page_views),
          bounce_rate_pct: pctChange(current.bounce_rate, previous.bounce_rate),
          duration_pct: pctChange(current.average_duration, previous.average_duration),
        },
      };

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_snapshot",
    "Quick today vs yesterday comparison: visitors, top referrer, top country, and duration trends",
    {
      site: z.string().describe("Site domain or UUID"),
    },
    async ({ site }) => {
      const siteId = await resolveSiteId(site);
      const [data, annotations] = await Promise.all([
        queryAnalytics({ site_id: siteId, type: "snapshot" }),
        queryAnalytics({
          site_id: siteId, type: "list_annotations",
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString(),
        }) as Promise<any[]>,
      ]);
      const snapshotMap = { average_duration_today: "avg_duration_today", average_duration_yesterday: "avg_duration_yesterday", visitor_change_percent: "visitor_change_pct", duration_change_percent: "duration_change_pct" };
      const result: Record<string, unknown> = { site, ...slim(data as any, snapshotMap) as object };
      if (Array.isArray(annotations) && annotations.length > 0) {
        result.last_annotation = annotations[annotations.length - 1];
      }
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_timeseries",
    "Get visitor and page view counts bucketed over time (hourly or daily). Returns an array of {date_label, page_views, unique_visitors} objects. Optional filters segment by country, browser, os, device type, UTM source, or referrer.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      interval: z.enum(["hour", "day"]).optional().describe("Bucket interval. Auto-selected based on period if omitted."),
      ...filterFields,
    },
    async ({ site, period, interval, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);
      const [data, annotations] = await Promise.all([
        queryAnalytics({
          site_id: siteId, type: "timeseries",
          start_date: range.start.toISOString(), end_date: range.end.toISOString(),
          interval: interval || range.interval,
          ...filterQuery,
        }),
        queryAnalytics({
          site_id: siteId, type: "list_annotations",
          start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        }),
      ]);
      const timeseriesMap = { date_label: "date", page_views: "views", unique_visitors: "visitors" };
      const result: Record<string, unknown> = { buckets: slim(data as any[], timeseriesMap) };
      if (Array.isArray(annotations) && annotations.length > 0) {
        result.annotations = annotations;
      }
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "get_funnel",
    "Compute a conversion funnel across an ordered sequence of pageview URLs and custom events. Returns per-step session counts and conversion rate relative to step 0. Steps must all occur within the same session, in order. Optional filters constrain which sessions enter the funnel.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      steps: z.array(
        z.object({
          type: z.enum(["pageview", "event"]).describe("'pageview' matches URL substring, 'event' matches event_name exactly"),
          match: z.string().describe("For pageview: URL substring (e.g. '/pricing'). For event: event name (e.g. 'signup_submit')"),
        })
      ).min(1).describe("Ordered steps — at least 1, typically 2-5"),
      ...filterFields,
    },
    async ({ site, period, steps, ...filters }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const filterQuery = pickFilters(filters);

      const data = await queryAnalytics({
        site_id: siteId, type: "funnel",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        steps: JSON.stringify(steps),
        ...filterQuery,
      });

      const funnelMap = { step_index: "step", step_type: "type", step_match: "match", conversion_rate: "rate" };
      return { content: [{ type: "text", text: JSON.stringify({ site, period, steps, results: slim(data as any[], funnelMap) }) }] };
    }
  );

  server.tool(
    "get_performance",
    "Get page load time metrics (average, median, p95) grouped by page URL, device type, country, or browser. Only includes data from pages with load time measurements. Useful for identifying slow pages and correlating performance with engagement.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      group_by: z.enum(["page", "device", "country", "browser"]).default("page").describe("Dimension to group by"),
      limit: z.number().default(20).describe("Max results (1-1000)"),
    },
    async ({ site, period, group_by, limit }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId, type: "performance",
        group_by,
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );
}
