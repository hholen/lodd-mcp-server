import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryAnalytics } from "../db.js";
import { resolveSiteId } from "../resolve-site.js";
import { parsePeriod } from "../date-ranges.js";

export function registerConversionTools(server: McpServer) {
  server.tool(
    "get_conversion_pages",
    "Find which pages lead to a specific conversion event. Shows pages viewed before the event in the same session, with conversion rate and average time to convert. Useful for identifying high-converting content.",
    {
      site: z.string().describe("Site domain or UUID"),
      event_name: z.string().describe("The conversion event name (e.g. 'signup_click', 'purchase')"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max results (1-1000)"),
    },
    async ({ site, event_name, period, limit }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId, type: "conversion_pages",
        event_name,
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "get_source_conversions",
    "Compare traffic sources by conversion rate for a specific event. Shows which referrers, UTM campaigns, and trackable links drive the most conversions, plus average time to convert per source.",
    {
      site: z.string().describe("Site domain or UUID"),
      event_name: z.string().describe("The conversion event name (e.g. 'signup_click', 'purchase')"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(20).describe("Max results (1-1000)"),
    },
    async ({ site, event_name, period, limit }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId, type: "source_conversions",
        event_name,
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );
}
