import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSignupTools } from "./tools/signup.js";
import { registerSiteTools } from "./tools/sites.js";
import { registerAnalyticsTools } from "./tools/analytics.js";
import { registerBreakdownTools } from "./tools/breakdowns.js";
import { registerEventTools } from "./tools/events.js";
import { registerRealtimeTools } from "./tools/realtime.js";
import { registerLinkTools } from "./tools/links.js";
import { registerUsageTools } from "./tools/usage.js";
import { registerConversionTools } from "./tools/conversions.js";
import { registerKeyTools } from "./tools/keys.js";
import { registerActorTools } from "./tools/actors.js";
import { registerAnnotationTools } from "./tools/annotations.js";
import { registerSessionTools } from "./tools/sessions.js";

export function registerAllTools(server: McpServer) {
  registerSiteTools(server);
  registerAnalyticsTools(server);
  registerBreakdownTools(server);
  registerEventTools(server);
  registerRealtimeTools(server);
  registerLinkTools(server);
  registerUsageTools(server);
  registerConversionTools(server);
  registerKeyTools(server);
  registerActorTools(server);
  registerAnnotationTools(server);
  registerSessionTools(server);
}

export { registerSignupTools };
export { runWithRequestContext } from "./request-context.js";
