import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { queryAnalytics, callEdgeFunction } from "../db.js";

export function registerSiteTools(server: McpServer) {
  server.tool(
    "list_sites",
    "List all websites you have access to with their domains and IDs",
    {},
    async () => {
      const sites = await queryAnalytics({ type: "sites" });

      return {
        content: [{ type: "text", text: JSON.stringify(sites) }],
      };
    }
  );

  server.tool(
    "create_site",
    "Register a new website for analytics tracking. Returns the site ID, tracking secret, and the script tag to embed.",
    {
      name: z.string().describe("Display name for the site (e.g. 'My Blog')"),
      domain: z.string().describe("Domain to track (e.g. 'example.com'). Do not include https:// or www."),
    },
    async ({ name, domain }) => {
      const site = await callEdgeFunction("analytics", {
        method: "POST",
        params: { type: "create_site" },
        body: { name, domain },
      }) as { id: string; name: string; domain: string; tracking_secret: string };

      const result = {
        site_id: site.id,
        name: site.name || name,
        domain: site.domain || domain,
        tracking_secret: site.tracking_secret || "",
        script_tag: `<script src="https://lodd.dev/tracking/v1.js" data-site-id="${site.id}" data-tracking-secret="${site.tracking_secret || ""}" defer></script>`,
        instructions: "Add the script tag to your website's <head> section. Analytics will start flowing within seconds of the first page view.",
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    }
  );

  server.tool(
    "exclude_my_ip",
    "Exclude an IP address from analytics tracking for a site. Prevents the user's own visits from appearing in the data. In Claude Code, detect the IP with `curl -s api.ipify.org` first. In conversation agents, ask the user to check their IP at api.ipify.org and paste it. Must be done per site.",
    {
      site: z.string().describe("Site domain (e.g. 'example.com') or UUID"),
      ip_address: z.string().optional().describe("The IP address to exclude. If omitted, uses the request's origin IP (only works from local MCP)."),
    },
    async ({ site, ip_address }) => {
      const { resolveSiteId } = await import("../resolve-site.js");
      const siteId = await resolveSiteId(site);
      const data = await callEdgeFunction("analytics", {
        method: "POST",
        params: { type: "exclude_my_ip" },
        body: { site_id: siteId, ...(ip_address ? { ip_address } : {}) },
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "share_site",
    "Give another user access to a site's analytics. They must have a Lodd account (signed up at lodd.dev). Only the site owner can share. The invited user gets a notification email.",
    {
      site: z.string().describe("Site domain or UUID"),
      email: z.string().email().describe("Email address of the user to invite"),
    },
    async ({ site, email }) => {
      const { resolveSiteId } = await import("../resolve-site.js");
      const siteId = await resolveSiteId(site);
      const data = await callEdgeFunction("analytics", {
        method: "POST",
        params: { type: "share_site", site_id: siteId },
        body: { email },
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "list_members",
    "List all users who have access to a site, with their roles (owner or member).",
    {
      site: z.string().describe("Site domain or UUID"),
    },
    async ({ site }) => {
      const { resolveSiteId } = await import("../resolve-site.js");
      const siteId = await resolveSiteId(site);
      const data = await queryAnalytics({ site_id: siteId, type: "list_members" });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.tool(
    "remove_member",
    "Remove a user's access to a site. Only the site owner can do this. Cannot remove the owner.",
    {
      site: z.string().describe("Site domain or UUID"),
      email: z.string().email().describe("Email address of the user to remove"),
    },
    async ({ site, email }) => {
      const { resolveSiteId } = await import("../resolve-site.js");
      const siteId = await resolveSiteId(site);
      const data = await callEdgeFunction("analytics", {
        method: "POST",
        params: { type: "remove_member", site_id: siteId },
        body: { email },
      });
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );
}
