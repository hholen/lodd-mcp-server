import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callEdgeFunction, queryAnalytics } from "../db.js";
import { resolveSiteId } from "../resolve-site.js";
import { parsePeriod } from "../date-ranges.js";
import { slim } from "../slim.js";

export function registerLinkTools(server: McpServer) {
  server.tool(
    "create_trackable_link",
    "Create a trackable link for campaign attribution. Append ?ld=<code> to your destination URL when sharing — clicks are attributed to the source in analytics.",
    {
      site: z.string().describe("Site domain or UUID"),
      destination_url: z.string().describe("The URL the link should redirect to"),
      source_type: z.enum([
        "reddit", "twitter", "hacker_news", "linkedin", "facebook",
        "instagram", "tiktok", "discord", "slack", "email",
        "newsletter", "forum", "blog", "other", "custom",
      ]).describe("Traffic source platform"),
      label: z.string().optional().describe("Human-readable label for this link"),
    },
    async ({ site, destination_url, source_type, label }) => {
      const siteId = await resolveSiteId(site);

      // Generate a random short code
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let shortCode = "";
      for (let i = 0; i < 8; i++) {
        shortCode += chars[Math.floor(Math.random() * chars.length)];
      }

      const data = await callEdgeFunction("analytics", {
        method: "POST",
        params: { type: "create_link", site_id: siteId },
        body: {
          short_code: shortCode,
          destination_url,
          source_type,
          source_label: label || source_type,
        },
      }) as any;

      const sep = data.destination_url.includes("?") ? "&" : "?";
      const result = {
        code: data.short_code,
        tracking_url: `${data.destination_url}${sep}ld=${data.short_code}`,
        destination_url: data.destination_url,
      };

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "list_trackable_links",
    "List all trackable links for a site with their click statistics",
    {
      site: z.string().describe("Site domain or UUID"),
      status: z.enum(["active", "archived", "all"]).default("active").describe("Filter by status"),
    },
    async ({ site, status }) => {
      const siteId = await resolveSiteId(site);

      const data = await queryAnalytics({
        type: "list_links",
        site_id: siteId,
        status,
      }) as any[];

      const links = (data || []).map((l: any) => ({
        ...l,
        code: l.short_code,
      }));

      const linksMap = { click_count: "clicks" };
      return { content: [{ type: "text", text: JSON.stringify(slim(links, linksMap)) }] };
    }
  );

  server.tool(
    "get_link_clicks",
    "Get click data for a specific trackable link, including referrers and countries. Returns up to 1000 most recent clicks.",
    {
      link: z.string().describe("Short code of the trackable link"),
      period: z.string().default("30d").describe("Time period"),
    },
    async ({ link, period }) => {
      const range = parsePeriod(period);

      const result = await queryAnalytics({
        type: "get_link_clicks",
        short_code: link,
        start_date: range.start.toISOString(),
        end_date: range.end.toISOString(),
      });

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
