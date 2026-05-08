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
