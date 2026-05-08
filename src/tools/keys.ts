import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callEdgeFunction, queryAnalytics } from "../db.js";

export function registerKeyTools(server: McpServer) {
  server.tool(
    "create_api_key",
    "Generate a new API key for the current user. Use this to create keys for managed agents, CI pipelines, or other tools that need access to your Lodd analytics. The key is shown only once — save it immediately.",
    {
      name: z.string().default("unnamed").describe("Label for this key (e.g. 'managed-agent', 'cursor', 'ci-pipeline')"),
    },
    async ({ name }) => {
      const data = await callEdgeFunction("analytics", {
        method: "POST",
        params: { type: "create_api_key" },
        body: { name },
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "list_api_keys",
    "List all API keys for the current user. Shows key prefix, name, creation date, and last used date. Does not reveal full keys.",
    {},
    async () => {
      const data = await queryAnalytics({ type: "list_api_keys" });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "revoke_api_key",
    "Permanently deactivate an API key. The key will immediately stop working. Use list_api_keys to find key IDs. Cannot be undone.",
    {
      key_id: z.string().uuid().describe("The UUID of the key to revoke (from list_api_keys)"),
    },
    async ({ key_id }) => {
      const data = await callEdgeFunction("analytics", {
        method: "POST",
        params: { type: "revoke_api_key" },
        body: { key_id },
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );
}
