import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryAnalytics } from "../db.js";
import { resolveSiteId } from "../resolve-site.js";
import { parsePeriod } from "../date-ranges.js";
import { slim } from "../slim.js";

export function registerActorTools(server: McpServer) {
  server.tool(
    "get_active_actors",
    "List distinct actors (opaque hashed identifiers) with their event counts, first/last seen, and total revenue. Actors are customer-hashed — Lodd never sees the original identifier. Only includes events where an actor was set.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(50).describe("Max results (1-1000)"),
    },
    async ({ site, period, limit }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId, type: "active_actors",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
      });
      const actorsMap = { event_count: "events", total_revenue: "revenue" };
      return { content: [{ type: "text", text: JSON.stringify(slim(data as Record<string, unknown>[], actorsMap)) }] };
    }
  );

  server.tool(
    "get_actor_activity",
    "Get the event timeline for a specific actor hash. Shows all events in chronological order with properties and revenue. The actor is an opaque identifier — Lodd does not know who it represents.",
    {
      site: z.string().describe("Site domain or UUID"),
      actor: z.string().describe("The actor hash to look up (from get_active_actors)"),
      period: z.string().default("30d").describe("Time period"),
      limit: z.number().default(100).describe("Max results (1-1000)"),
    },
    async ({ site, actor, period, limit }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId, type: "actor_activity",
        actor,
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
        limit: Math.min(Math.max(limit, 1), 1000),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "get_actor_retention",
    "Get weekly cohort retention by actor hash. Groups actors by the week they first appeared, then shows how many returned in weeks 1-4. Actors are opaque hashes — no personal data is stored or exposed. Requires 2+ weeks of data for meaningful results.",
    {
      site: z.string().describe("Site domain or UUID"),
      period: z.string().default("90d").describe("Time period (use 90d for meaningful cohorts)"),
    },
    async ({ site, period }) => {
      const siteId = await resolveSiteId(site);
      const range = parsePeriod(period);
      const data = await queryAnalytics({
        site_id: siteId, type: "actor_retention",
        start_date: range.start.toISOString(), end_date: range.end.toISOString(),
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );
}
