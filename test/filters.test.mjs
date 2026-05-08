import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { pickFilters, filterFields } from "../dist/filters.js";

describe("pickFilters", () => {
  test("returns empty object when no filters set", () => {
    assert.deepEqual(pickFilters({}), {});
  });

  test("returns empty object when all filters undefined", () => {
    const input = {
      filter_country: undefined,
      filter_browser: undefined,
      filter_os: undefined,
      filter_device_type: undefined,
      filter_utm_source: undefined,
      filter_referrer_contains: undefined,
    };
    assert.deepEqual(pickFilters(input), {});
  });

  test("picks only defined filter values", () => {
    const input = {
      filter_country: "US",
      filter_browser: undefined,
      filter_os: "iOS",
      site: "example.com",
      period: "30d",
    };
    assert.deepEqual(pickFilters(input), {
      filter_country: "US",
      filter_os: "iOS",
    });
  });

  test("picks all six filters when all set", () => {
    const input = {
      filter_country: "DE",
      filter_browser: "Chrome",
      filter_os: "Windows",
      filter_device_type: "desktop",
      filter_utm_source: "twitter",
      filter_referrer_contains: "google",
    };
    const result = pickFilters(input);
    assert.equal(Object.keys(result).length, 6);
    assert.equal(result.filter_country, "DE");
    assert.equal(result.filter_browser, "Chrome");
    assert.equal(result.filter_device_type, "desktop");
  });

  test("ignores non-filter keys", () => {
    const input = {
      site: "example.com",
      period: "7d",
      interval: "day",
      filter_country: "NO",
    };
    const result = pickFilters(input);
    assert.deepEqual(result, { filter_country: "NO" });
    assert.equal(result.site, undefined);
  });
});

describe("filterFields schema", () => {
  test("exports all six filter field definitions", () => {
    const keys = Object.keys(filterFields);
    assert.deepEqual(keys.sort(), [
      "filter_browser",
      "filter_country",
      "filter_device_type",
      "filter_os",
      "filter_referrer_contains",
      "filter_utm_source",
    ]);
  });

  test("all fields are optional zod schemas", () => {
    for (const [key, schema] of Object.entries(filterFields)) {
      assert.ok(schema.isOptional(), `${key} should be optional`);
    }
  });
});
