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
});
