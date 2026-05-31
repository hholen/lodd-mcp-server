import { test, describe } from "node:test";
import assert from "node:assert/strict";

function createMockServer() {
  const tools = {};
  return {
    tool: (name, description, schema, handler) => {
      tools[name] = { name, description, schema, handler };
    },
    tools,
  };
}

describe("analytics tools filter support", () => {
  let tools;

  test("registers tools with filter params", async () => {
    const server = createMockServer();
    const { registerAnalyticsTools } = await import("../dist/tools/analytics.js");
    registerAnalyticsTools(server);
    tools = server.tools;

    assert.ok(tools.get_analytics, "get_analytics registered");
    assert.ok(tools.get_timeseries, "get_timeseries registered");
    assert.ok(tools.get_funnel, "get_funnel registered");
  });

  test("get_timeseries accepts all 6 filters", async () => {
    const server = createMockServer();
    const { registerAnalyticsTools } = await import("../dist/tools/analytics.js");
    registerAnalyticsTools(server);
    const schema = server.tools.get_timeseries.schema;

    for (const key of ["filter_country", "filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
      assert.ok(schema[key], `get_timeseries should have ${key}`);
    }
  });

  test("get_funnel accepts all 6 filters", async () => {
    const server = createMockServer();
    const { registerAnalyticsTools } = await import("../dist/tools/analytics.js");
    registerAnalyticsTools(server);
    const schema = server.tools.get_funnel.schema;

    for (const key of ["filter_country", "filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
      assert.ok(schema[key], `get_funnel should have ${key}`);
    }
  });

  test("get_analytics accepts all 6 filters", async () => {
    const server = createMockServer();
    const { registerAnalyticsTools } = await import("../dist/tools/analytics.js");
    registerAnalyticsTools(server);
    const schema = server.tools.get_analytics.schema;

    for (const key of ["filter_country", "filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
      assert.ok(schema[key], `get_analytics should have ${key}`);
    }
  });
});

describe("breakdown tools filter support", () => {
  test("get_traffic_sources accepts all 6 filters", async () => {
    const server = createMockServer();
    const { registerBreakdownTools } = await import("../dist/tools/breakdowns.js");
    registerBreakdownTools(server);
    const schema = server.tools.get_traffic_sources.schema;

    for (const key of ["filter_country", "filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
      assert.ok(schema[key], `get_traffic_sources should have ${key}`);
    }
  });

  test("get_countries excludes filter_country but has other 5 filters", async () => {
    const server = createMockServer();
    const { registerBreakdownTools } = await import("../dist/tools/breakdowns.js");
    registerBreakdownTools(server);
    const schema = server.tools.get_countries.schema;

    assert.equal(schema.filter_country, undefined, "get_countries should NOT have filter_country");
    for (const key of ["filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
      assert.ok(schema[key], `get_countries should have ${key}`);
    }
  });

  test("get_bot_report is registered without filters", async () => {
    const server = createMockServer();
    const { registerBreakdownTools } = await import("../dist/tools/breakdowns.js");
    registerBreakdownTools(server);

    assert.ok(server.tools.get_bot_report, "get_bot_report should be registered");
    assert.ok(server.tools.get_bot_report.schema.site, "should have site param");
    assert.ok(server.tools.get_bot_report.schema.period, "should have period param");
    assert.equal(server.tools.get_bot_report.schema.filter_country, undefined, "should not have filters");
  });

  test("get_tech_breakdown accepts all 6 filters", async () => {
    const server = createMockServer();
    const { registerBreakdownTools } = await import("../dist/tools/breakdowns.js");
    registerBreakdownTools(server);
    const schema = server.tools.get_tech_breakdown.schema;

    for (const key of ["filter_country", "filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
      assert.ok(schema[key], `get_tech_breakdown should have ${key}`);
    }
  });
});

describe("IP exclusion tool", () => {
  test("exclude_my_ip is registered with site and optional ip_address", async () => {
    const server = createMockServer();
    const { registerSiteTools } = await import("../dist/tools/sites.js");
    registerSiteTools(server);

    assert.ok(server.tools.exclude_my_ip, "exclude_my_ip should be registered");
    const schema = server.tools.exclude_my_ip.schema;
    assert.ok(schema.site, "should have site param");
    assert.ok(schema.ip_address, "should have ip_address param");
  });
});

describe("performance tool", () => {
  test("get_performance is registered with group_by param", async () => {
    const server = createMockServer();
    const { registerAnalyticsTools } = await import("../dist/tools/analytics.js");
    registerAnalyticsTools(server);

    assert.ok(server.tools.get_performance, "get_performance should be registered");
    const schema = server.tools.get_performance.schema;
    assert.ok(schema.site, "should have site param");
    assert.ok(schema.period, "should have period param");
    assert.ok(schema.group_by, "should have group_by param");
    assert.ok(schema.limit, "should have limit param");
  });
});

describe("entry/exit pages tool", () => {
  test("get_entry_exit_pages is registered with filters", async () => {
    const server = createMockServer();
    const { registerBreakdownTools } = await import("../dist/tools/breakdowns.js");
    registerBreakdownTools(server);

    assert.ok(server.tools.get_entry_exit_pages, "get_entry_exit_pages should be registered");
    const schema = server.tools.get_entry_exit_pages.schema;
    assert.ok(schema.site, "should have site param");
    assert.ok(schema.period, "should have period param");
    assert.ok(schema.limit, "should have limit param");
    for (const key of ["filter_country", "filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
      assert.ok(schema[key], `get_entry_exit_pages should have ${key}`);
    }
  });
});

describe("conversion attribution tools", () => {
  test("get_conversion_pages is registered with event_name param", async () => {
    const server = createMockServer();
    const { registerConversionTools } = await import("../dist/tools/conversions.js");
    registerConversionTools(server);

    assert.ok(server.tools.get_conversion_pages, "get_conversion_pages should be registered");
    const schema = server.tools.get_conversion_pages.schema;
    assert.ok(schema.site, "should have site param");
    assert.ok(schema.event_name, "should have event_name param");
    assert.ok(schema.period, "should have period param");
    assert.ok(schema.limit, "should have limit param");
    assert.equal(schema.filter_country, undefined, "should not have filters (attribution is unfiltered)");
  });

  test("get_source_conversions is registered with event_name param", async () => {
    const server = createMockServer();
    const { registerConversionTools } = await import("../dist/tools/conversions.js");
    registerConversionTools(server);

    assert.ok(server.tools.get_source_conversions, "get_source_conversions should be registered");
    const schema = server.tools.get_source_conversions.schema;
    assert.ok(schema.site, "should have site param");
    assert.ok(schema.event_name, "should have event_name param");
    assert.ok(schema.period, "should have period param");
  });
});

describe("API key management tools", () => {
  test("create_api_key is registered with name param", async () => {
    const server = createMockServer();
    const { registerKeyTools } = await import("../dist/tools/keys.js");
    registerKeyTools(server);

    assert.ok(server.tools.create_api_key, "create_api_key should be registered");
    assert.ok(server.tools.create_api_key.schema.name, "should have name param");
  });

  test("list_api_keys is registered with no required params", async () => {
    const server = createMockServer();
    const { registerKeyTools } = await import("../dist/tools/keys.js");
    registerKeyTools(server);

    assert.ok(server.tools.list_api_keys, "list_api_keys should be registered");
  });

  test("revoke_api_key is registered with key_id param", async () => {
    const server = createMockServer();
    const { registerKeyTools } = await import("../dist/tools/keys.js");
    registerKeyTools(server);

    assert.ok(server.tools.revoke_api_key, "revoke_api_key should be registered");
    assert.ok(server.tools.revoke_api_key.schema.key_id, "should have key_id param");
  });
});

describe("event tools filter support", () => {
  test("get_event_counts accepts all 6 filters", async () => {
    const server = createMockServer();
    const { registerEventTools } = await import("../dist/tools/events.js");
    registerEventTools(server);
    const schema = server.tools.get_event_counts.schema;

    for (const key of ["filter_country", "filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
      assert.ok(schema[key], `get_event_counts should have ${key}`);
    }
  });

  test("get_event_timeseries accepts all 6 filters", async () => {
    const server = createMockServer();
    const { registerEventTools } = await import("../dist/tools/events.js");
    registerEventTools(server);
    const schema = server.tools.get_event_timeseries.schema;

    for (const key of ["filter_country", "filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
      assert.ok(schema[key], `get_event_timeseries should have ${key}`);
    }
  });

  test("get_events does NOT have filters (raw event records)", async () => {
    const server = createMockServer();
    const { registerEventTools } = await import("../dist/tools/events.js");
    registerEventTools(server);
    const schema = server.tools.get_events.schema;

    assert.equal(schema.filter_country, undefined, "get_events should not have filter_country");
  });
});

describe("annotation tools", () => {
  test("create_annotation is registered with site, content, and optional timestamp", async () => {
    const server = createMockServer();
    const { registerAnnotationTools } = await import("../dist/tools/annotations.js");
    registerAnnotationTools(server);

    assert.ok(server.tools.create_annotation, "create_annotation registered");
    const schema = server.tools.create_annotation.schema;
    assert.ok(schema.site, "has site param");
    assert.ok(schema.content, "has content param");
    assert.ok(schema.timestamp, "has timestamp param");
  });

  test("list_annotations is registered with site and period", async () => {
    const server = createMockServer();
    const { registerAnnotationTools } = await import("../dist/tools/annotations.js");
    registerAnnotationTools(server);

    assert.ok(server.tools.list_annotations, "list_annotations registered");
    const schema = server.tools.list_annotations.schema;
    assert.ok(schema.site, "has site param");
    assert.ok(schema.period, "has period param");
  });
});

describe("site sharing tools", () => {
  test("share_site is registered with site and email", async () => {
    const server = createMockServer();
    const { registerSiteTools } = await import("../dist/tools/sites.js");
    registerSiteTools(server);

    assert.ok(server.tools.share_site, "share_site registered");
    const schema = server.tools.share_site.schema;
    assert.ok(schema.site, "has site param");
    assert.ok(schema.email, "has email param");
  });

  test("list_members is registered with site", async () => {
    const server = createMockServer();
    const { registerSiteTools } = await import("../dist/tools/sites.js");
    registerSiteTools(server);

    assert.ok(server.tools.list_members, "list_members registered");
    const schema = server.tools.list_members.schema;
    assert.ok(schema.site, "has site param");
  });

  test("remove_member is registered with site and email", async () => {
    const server = createMockServer();
    const { registerSiteTools } = await import("../dist/tools/sites.js");
    registerSiteTools(server);

    assert.ok(server.tools.remove_member, "remove_member registered");
    const schema = server.tools.remove_member.schema;
    assert.ok(schema.site, "has site param");
    assert.ok(schema.email, "has email param");
  });
});

describe("session analytics tools", () => {
  test("get_session_paths is registered with expected params", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);

    assert.ok(server.tools.get_session_paths, "get_session_paths registered");
    const schema = server.tools.get_session_paths.schema;
    assert.ok(schema.site, "has site param");
    assert.ok(schema.period, "has period param");
    assert.ok(schema.limit, "has limit param");
    assert.ok(schema.min_sessions, "has min_sessions param");
    assert.ok(schema.max_steps, "has max_steps param");
  });

  test("get_dropoff_destinations requires from_url", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);

    assert.ok(server.tools.get_dropoff_destinations, "get_dropoff_destinations registered");
    assert.ok(server.tools.get_dropoff_destinations.schema.from_url, "has from_url param");
  });

  test("get_session_scores has optional conversion_event", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);

    assert.ok(server.tools.get_session_scores, "get_session_scores registered");
    assert.ok(server.tools.get_session_scores.schema.conversion_event, "has conversion_event param");
  });

  test("get_event_sequences requires target_event", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);

    assert.ok(server.tools.get_event_sequences, "get_event_sequences registered");
    assert.ok(server.tools.get_event_sequences.schema.target_event, "has target_event param");
    assert.ok(server.tools.get_event_sequences.schema.lookback_steps, "has lookback_steps param");
  });

  test("get_content_groups requires groups array", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);

    assert.ok(server.tools.get_content_groups, "get_content_groups registered");
    assert.ok(server.tools.get_content_groups.schema.groups, "has groups param");
  });

  test("all session tools have filter support", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);

    for (const toolName of ["get_session_paths", "get_dropoff_destinations", "get_session_scores", "get_event_sequences", "get_content_groups"]) {
      const schema = server.tools[toolName].schema;
      for (const key of ["filter_country", "filter_browser", "filter_os", "filter_device_type", "filter_utm_source", "filter_referrer_contains"]) {
        assert.ok(schema[key], `${toolName} should have ${key}`);
      }
    }
  });
});

describe("session tools parameter validation", () => {
  test("get_session_paths: min_sessions has a default of 2", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);
    const schema = server.tools.get_session_paths.schema;

    assert.equal(schema.min_sessions._def.type, "default", "min_sessions should have a default");
    assert.equal(schema.min_sessions._def.defaultValue, 2, "default should be 2");
  });

  test("get_session_paths: max_steps has a default of 10", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);
    const schema = server.tools.get_session_paths.schema;

    assert.equal(schema.max_steps._def.type, "default", "max_steps should have a default");
    assert.equal(schema.max_steps._def.defaultValue, 10, "default should be 10");
  });

  test("get_session_paths: limit has a default of 20", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);
    const schema = server.tools.get_session_paths.schema;

    assert.equal(schema.limit._def.type, "default", "limit should have a default");
    assert.equal(schema.limit._def.defaultValue, 20, "default should be 20");
  });

  test("get_dropoff_destinations: from_url is required (no default, not optional)", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);
    const schema = server.tools.get_dropoff_destinations.schema;

    assert.equal(schema.from_url.isOptional(), false, "from_url should not be optional");
    assert.notEqual(schema.from_url._def?.type, "default", "from_url should not have a default");
  });

  test("get_session_scores: conversion_event is optional", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);
    const schema = server.tools.get_session_scores.schema;

    assert.equal(schema.conversion_event.isOptional(), true, "conversion_event should be optional");
  });

  test("get_event_sequences: target_event is required", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);
    const schema = server.tools.get_event_sequences.schema;

    assert.equal(schema.target_event.isOptional(), false, "target_event should be required");
  });

  test("get_event_sequences: lookback_steps has a default of 5", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);
    const schema = server.tools.get_event_sequences.schema;

    assert.equal(schema.lookback_steps._def.type, "default", "lookback_steps should have a default");
    assert.equal(schema.lookback_steps._def.defaultValue, 5, "default should be 5");
  });

  test("get_content_groups: groups is required and rejects empty arrays", async () => {
    const server = createMockServer();
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    registerSessionTools(server);
    const schema = server.tools.get_content_groups.schema;

    assert.equal(schema.groups.isOptional(), false, "groups should be required");
    // min(1) means empty arrays are rejected
    const result = schema.groups.safeParse([]);
    assert.equal(result.success, false, "empty array should fail validation");
  });
});

describe("tool description quality", () => {
  let allTools;

  test("registers all tools from all tool files", async () => {
    const server = createMockServer();
    const { registerAnalyticsTools } = await import("../dist/tools/analytics.js");
    const { registerBreakdownTools } = await import("../dist/tools/breakdowns.js");
    const { registerEventTools } = await import("../dist/tools/events.js");
    const { registerSessionTools } = await import("../dist/tools/sessions.js");
    const { registerSiteTools } = await import("../dist/tools/sites.js");
    const { registerConversionTools } = await import("../dist/tools/conversions.js");
    const { registerKeyTools } = await import("../dist/tools/keys.js");
    const { registerLinkTools } = await import("../dist/tools/links.js");
    const { registerRealtimeTools } = await import("../dist/tools/realtime.js");
    const { registerUsageTools } = await import("../dist/tools/usage.js");
    const { registerActorTools } = await import("../dist/tools/actors.js");
    const { registerAnnotationTools } = await import("../dist/tools/annotations.js");
    const { registerSignupTools } = await import("../dist/tools/signup.js");

    registerAnalyticsTools(server);
    registerBreakdownTools(server);
    registerEventTools(server);
    registerSessionTools(server);
    registerSiteTools(server);
    registerConversionTools(server);
    registerKeyTools(server);
    registerLinkTools(server);
    registerRealtimeTools(server);
    registerUsageTools(server);
    registerActorTools(server);
    registerAnnotationTools(server);
    registerSignupTools(server);

    allTools = server.tools;
    const toolCount = Object.keys(allTools).length;
    assert.ok(toolCount >= 30, `Expected at least 30 tools, got ${toolCount}`);
  });

  test("every tool description is at least 20 characters", async () => {
    assert.ok(allTools, "tools must be registered first");
    for (const [name, tool] of Object.entries(allTools)) {
      assert.ok(
        typeof tool.description === "string" && tool.description.length >= 20,
        `${name} description too short (${tool.description?.length ?? 0} chars): "${tool.description}"`
      );
    }
  });

  test("no tool description contains banned word 'genuinely'", async () => {
    assert.ok(allTools, "tools must be registered first");
    for (const [name, tool] of Object.entries(allTools)) {
      assert.ok(
        !tool.description.toLowerCase().includes("genuinely"),
        `${name} description contains banned word "genuinely"`
      );
    }
  });

  test("every tool name uses snake_case", async () => {
    assert.ok(allTools, "tools must be registered first");
    const snakeCaseRe = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;
    for (const name of Object.keys(allTools)) {
      assert.ok(
        snakeCaseRe.test(name),
        `Tool name "${name}" is not snake_case`
      );
    }
  });
});
