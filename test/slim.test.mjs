import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { slim } from "../dist/slim.js";

describe("slim", () => {
  test("renames keys in a single object", () => {
    const data = { page_view_count: 42, unique_visitors: 10 };
    const map = { page_view_count: "views", unique_visitors: "visitors" };
    assert.deepEqual(slim(data, map), { views: 42, visitors: 10 });
  });

  test("renames keys in an array of objects", () => {
    const data = [
      { page_path: "/", page_view_count: 100 },
      { page_path: "/about", page_view_count: 50 },
    ];
    const map = { page_path: "path", page_view_count: "views" };
    assert.deepEqual(slim(data, map), [
      { path: "/", views: 100 },
      { path: "/about", views: 50 },
    ]);
  });

  test("passes through keys not in the map unchanged", () => {
    const data = { page_path: "/", extra: "keep me" };
    const map = { page_path: "path" };
    assert.deepEqual(slim(data, map), { path: "/", extra: "keep me" });
  });

  test("handles empty map (returns object unchanged)", () => {
    const data = { page_path: "/", views: 42 };
    assert.deepEqual(slim(data, {}), { page_path: "/", views: 42 });
  });

  test("handles empty array", () => {
    assert.deepEqual(slim([], { page_path: "path" }), []);
  });

  test("passes through nested objects unchanged", () => {
    const data = { page_path: "/", meta: { title: "Home", tags: ["a", "b"] } };
    const map = { page_path: "path" };
    const result = slim(data, map);
    assert.deepEqual(result, { path: "/", meta: { title: "Home", tags: ["a", "b"] } });
    // Nested object should be the same reference (shallow rename, not deep copy)
    assert.equal(result.meta, data.meta);
  });

  test("handles null values", () => {
    const data = { page_path: "/", referrer: null };
    const map = { page_path: "path" };
    assert.deepEqual(slim(data, map), { path: "/", referrer: null });
  });

  test("handles null values in array of objects", () => {
    const data = [
      { page_path: "/", utm_source: null },
      { page_path: "/about", utm_source: "twitter" },
    ];
    const map = { page_path: "path", utm_source: "source" };
    assert.deepEqual(slim(data, map), [
      { path: "/", source: null },
      { path: "/about", source: "twitter" },
    ]);
  });
});
