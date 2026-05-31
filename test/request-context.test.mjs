import { test, describe } from "node:test";
import assert from "node:assert/strict";

const { runWithRequestContext, getRequestContext } = await import("../dist/request-context.js");
const { getApiKey, getApiUrl, hasApiKey } = await import("../dist/auth.js");

describe("request context", () => {
  test("getApiKey reads from the active context", () => {
    runWithRequestContext({ apiKey: "ca_live_AAA", apiUrl: "https://x.test" }, () => {
      assert.equal(getApiKey(), "ca_live_AAA");
      assert.equal(getApiUrl(), "https://x.test");
      assert.equal(hasApiKey(), true);
    });
  });

  test("falls back to process.env outside any context (stdio path)", () => {
    const prev = process.env.LODD_API_KEY;
    process.env.LODD_API_KEY = "ca_live_ENV";
    try {
      assert.equal(getRequestContext(), undefined);
      assert.equal(getApiKey(), "ca_live_ENV");
    } finally {
      if (prev === undefined) delete process.env.LODD_API_KEY;
      else process.env.LODD_API_KEY = prev;
    }
  });

  test("concurrent contexts do not bleed across interleaved awaits", async () => {
    // This is the property the cross-tenant fix depends on: two requests running
    // concurrently in one process must each see only their own key, even when
    // their async work interleaves.
    const tick = () => new Promise((r) => setTimeout(r, 1));

    async function request(key) {
      return runWithRequestContext({ apiKey: key }, async () => {
        assert.equal(getApiKey(), key);
        await tick();
        assert.equal(getApiKey(), key); // still mine after yielding
        await tick();
        return getApiKey();
      });
    }

    const [a, b, c] = await Promise.all([
      request("ca_live_A"),
      request("ca_live_B"),
      request("ca_live_C"),
    ]);
    assert.equal(a, "ca_live_A");
    assert.equal(b, "ca_live_B");
    assert.equal(c, "ca_live_C");
  });

  test("usageWarning is isolated per context", async () => {
    const { _setUsageWarningForTest, withUsageWarning } = await import("../dist/db.js");
    const tick = () => new Promise((r) => setTimeout(r, 1));

    async function request(warning) {
      return runWithRequestContext({ apiKey: "ca_live_x" }, async () => {
        _setUsageWarningForTest(warning);
        await tick();
        return withUsageWarning([{ type: "text", text: "body" }]).content;
      });
    }

    const [withW, withoutW] = await Promise.all([
      request("⚠️ mine"),
      request(null),
    ]);
    assert.equal(withW.length, 2);
    assert.equal(withW[1].text, "⚠️ mine");
    assert.equal(withoutW.length, 1); // no warning bled in from the other request
  });
});
