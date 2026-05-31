# @lodd/mcp-server

Headless web analytics for AI agents. 42 MCP tools covering traffic, events, funnels, conversions, sources, performance, and actor analytics.

No dashboard. Your agent queries structured JSON directly.

## Quick start

```bash
npx -y @lodd/mcp-server
```

Set `LODD_API_KEY` in your environment. Get a key at [lodd.dev](https://lodd.dev).

## Claude Code / Cursor

Add to your MCP config:

```json
{
  "mcpServers": {
    "lodd": {
      "command": "npx",
      "args": ["-y", "@lodd/mcp-server"],
      "env": {
        "LODD_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Claude Desktop / claude.ai

Add `https://api.lodd.dev/mcp` as an MCP connector. OAuth handles auth automatically.

## What you can ask

- "How's traffic this week?"
- "Show me the pages with the highest bounce rate"
- "Build a funnel from homepage to signup to purchase"
- "Which traffic sources drive the most conversions?"
- "Something unusual is happening today. Investigate."

## Tools

42 tools across analytics, breakdowns, events, conversions, actors, annotations, trackable links, and account management. Full reference at [lodd.dev/docs](https://lodd.dev/docs).

## REST API

Same data is also available via REST at `api.lodd.dev/v1/`. API docs at [lodd.dev/api](https://lodd.dev/api). OpenAPI spec at [lodd.dev/openapi.yaml](https://lodd.dev/openapi.yaml).

## Pricing

Free up to 2,500 events/month. EUR 9.99/month for 100K events. All tools included on both tiers.

## Links

- [Documentation](https://lodd.dev/docs)
- [API reference](https://lodd.dev/api)
- [Agent setup instructions](https://lodd.dev/llms.txt)
- [lodd.dev](https://lodd.dev)
