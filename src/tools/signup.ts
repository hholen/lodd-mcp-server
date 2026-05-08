import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getApiUrl } from "../auth.js";
import { getClientInfo } from "../client-info.js";

export function registerSignupTools(server: McpServer) {
  server.tool(
    "authenticate",
    "Start Lodd authentication. Sends a verification code to the provided email. Works for both new and existing accounts.",
    {
      email: z.string().email().describe("The user's email address"),
    },
    async ({ email }) => {
      const baseUrl = getApiUrl();
      const clientInfo = getClientInfo();

      const response = await fetch(`${baseUrl}/functions/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          signup_source: clientInfo?.name || "unknown",
          signup_source_version: clientInfo?.version || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          content: [{ type: "text" as const, text: `Error: ${data.error || response.statusText}` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            ...data,
            next_step: "Ask the user for the 6-digit code from their email, then call verify_code with the email and code. This works for both new and returning users.",
          }),
        }],
      };
    }
  );

  server.tool(
    "verify_code",
    "Verify the email code and get an API key. After this succeeds, update the MCP server config with the returned API key as LODD_API_KEY and restart the server.",
    {
      email: z.string().email().describe("The email address used in the signup step"),
      code: z.string().min(6).describe("The 6-digit verification code from the user's email"),
    },
    async ({ email, code }) => {
      const baseUrl = getApiUrl();

      const response = await fetch(`${baseUrl}/functions/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          content: [{ type: "text" as const, text: `Error: ${data.error || response.statusText}` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            ...data,
            setup_instructions: [
              `Save the API key to your MCP server config as LODD_API_KEY environment variable.`,
              `The key is: ${data.api_key}`,
              `After updating the config, restart the MCP server to enable all analytics tools.`,
            ],
          }),
        }],
      };
    }
  );
}
