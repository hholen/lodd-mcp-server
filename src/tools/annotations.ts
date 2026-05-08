import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callEdgeFunction, queryAnalytics } from "../db.js";
import { resolveSiteId } from "../resolve-site.js";
import { parsePeriod } from "../date-ranges.js";

export function registerAnnotationTools(server: McpServer) {
  server.tool(
    "create_annotation",
    "Record a user-facing change that may affect analytics. Call after deploying changes to pages, flows, or tracking. Skip dependency updates, CI config, and refactors with no visible impact.",
    {
      site: z.string().describe("Site domain or UUID"),
      content: z.string().max(500).describe("What changed (e.g. 'Simplified checkout to single step')"),
      timestamp: z.string().optional().describe("When it happened (ISO 8601). Defaults to now."),
    },
    async ({ site, content, timestamp }) => {
      const siteId = await resolveSiteId(site);
      const data = await callEdgeFunction("analytics", {
        method: "POST",
        params: { type: "create_annotation", site_id: siteId },
        body: { content, ...(timestamp ? { timestamp } : {}) },
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "list_annotations",
    "List annotations (deploy notes, change records) for a site within a time period.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
    },
    async ({ site, period }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId,
        type: "list_annotations",
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString(),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );
}
