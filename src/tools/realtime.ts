import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryAnalytics } from "../db.js";
import { resolveSiteId } from "../resolve-site.js";

export function registerRealtimeTools(server: McpServer) {
  server.tool(
    "get_realtime",
    "Get the number of currently active visitors on a site (visitors with activity in the last 5 minutes)",
    {
      site: z.string().describe("Site domain or UUID"),
    },
    async ({ site }) => {
      const siteId = await resolveSiteId(site);
      const data = await queryAnalytics({ site_id: siteId, type: "current_visitors" });
      const result = { site, active_visitors: data ?? 0 };
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );
}
