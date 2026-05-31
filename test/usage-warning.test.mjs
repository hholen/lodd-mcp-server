import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import { withUsageWarning, _setUsageWarningForTest } from "../dist/db.js";

afterEach(() => {
  _setUsageWarningForTest(null);
});

describe("withUsageWarning", () => {
  test("returns content unchanged when no warning is set", () => {
    const content = [{ type: "text", text: '{"views": 42}' }];
    const result = withUsageWarning(content);
    assert.deepEqual(result, { content });
  });

  test("preserves content array type and structure", () => {
    const content = [
      { type: "text", text: '{"page": "/"}' },
      { type: "text", text: '{"page": "/about"}' },
    ];
    const result = withUsageWarning(content);
    assert.ok(Array.isArray(result.content), "content should be an array");
    assert.equal(result.content.length, 2, "should have 2 items");
    assert.equal(result.content[0].type, "text");
    assert.equal(result.content[1].type, "text");
  });

  test("returns same reference when no warning (no unnecessary copy)", () => {
    const content = [{ type: "text", text: "data" }];
    const result = withUsageWarning(content);
    assert.equal(result.content, content, "should return same array reference when no warning");
  });

  test("wraps single-item content correctly", () => {
    const content = [{ type: "text", text: "hello" }];
    const result = withUsageWarning(content);
    assert.equal(result.content.length, 1);
    assert.equal(result.content[0].text, "hello");
  });

  test("handles empty content array", () => {
    const content = [];
    const result = withUsageWarning(content);
    assert.deepEqual(result, { content: [] });
  });

  test("appends warning when usage warning is set", () => {
    _setUsageWarningForTest("⚠️ Usage: 2000/2500 events (80%). Upgrade at lodd.dev/account.");
    const content = [{ type: "text", text: '{"views": 42}' }];
    const result = withUsageWarning(content);
    assert.equal(result.content.length, 2, "should have original + warning");
    assert.equal(result.content[0].text, '{"views": 42}', "original content preserved");
    assert.ok(result.content[1].text.includes("⚠️ Usage:"), "warning appended");
  });

  test("warning is appended as last item, not prepended", () => {
    _setUsageWarningForTest("⚠️ Usage: 2250/2500 events (90%). Upgrade at lodd.dev/account.");
    const content = [
      { type: "text", text: "first" },
      { type: "text", text: "second" },
    ];
    const result = withUsageWarning(content);
    assert.equal(result.content.length, 3);
    assert.equal(result.content[0].text, "first");
    assert.equal(result.content[1].text, "second");
    assert.ok(result.content[2].text.includes("90%"));
  });

  test("100% warning includes paused message", () => {
    _setUsageWarningForTest("⚠️ Usage: 2500/2500 events (100%). Tracking is paused. Upgrade at lodd.dev/account.");
    const content = [{ type: "text", text: "data" }];
    const result = withUsageWarning(content);
    assert.equal(result.content.length, 2);
    assert.ok(result.content[1].text.includes("paused"), "should mention tracking is paused");
  });

  test("warning does not mutate original content array", () => {
    _setUsageWarningForTest("⚠️ warning");
    const content = [{ type: "text", text: "original" }];
    const originalLength = content.length;
    withUsageWarning(content);
    assert.equal(content.length, originalLength, "original array should not be modified");
  });

  test("warning is cleared after reset", () => {
    _setUsageWarningForTest("⚠️ warning");
    _setUsageWarningForTest(null);
    const content = [{ type: "text", text: "data" }];
    const result = withUsageWarning(content);
    assert.equal(result.content.length, 1, "no warning after reset");
  });
});
