#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { hasApiKey, getApiUrl } from "./auth.js";
import { setClientInfo } from "./client-info.js";
import { registerAllTools, registerSignupTools } from "./register-tools.js";

getApiUrl();

const server = new McpServer({
  name: "lodd",
  version: "0.1.1",
});

if (hasApiKey()) {
  registerAllTools(server);
} else {
  registerSignupTools(server);
}

const transport = new StdioServerTransport();
await server.connect(transport);

const info = server.server.getClientVersion();
if (info) setClientInfo(info.name, info.version);
