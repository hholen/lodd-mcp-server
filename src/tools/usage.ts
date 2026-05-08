import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callEdgeFunction } from "../db.js";

export function registerUsageTools(server: McpServer) {
  server.tool(
    "get_usage",
    "Get current month's event usage and plan limits. Returns plan type, events used, monthly limit, and percentage.",
    {},
    async () => {
      const data = await callEdgeFunction("analytics", {
        params: { type: "usage" },
      }) as { plan: string; used: number; limit: number; month: string };

      const percent = data.limit > 0 ? Math.round((data.used / data.limit) * 100) : 0;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ ...data, percent }),
          },
        ],
      };
    },
  );
}
