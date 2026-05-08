import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parsePeriod, getPreviousPeriod } from "../dist/date-ranges.js";

describe("parsePeriod", () => {
  test("parses 'today' to hourly interval", () => {
    const range = parsePeriod("today");
    assert.equal(range.interval, "hour");
    const now = new Date();
    assert.equal(range.start.getDate(), now.getDate());
  });

  test("parses 'yesterday' to hourly interval", () => {
    const range = parsePeriod("yesterday");
    assert.equal(range.interval, "hour");
  });

  test("parses '7d' to daily interval covering ~7 days", () => {
    const range = parsePeriod("7d");
    assert.equal(range.interval, "day");
    const days = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24);
    // start is 7 days ago at midnight, end is now — so duration is 7 + fraction of today
    assert.ok(days >= 7 && days <= 8, `Expected 7-8 days, got ${days}`);
  });

  test("parses '90d' to daily interval", () => {
    const range = parsePeriod("90d");
    assert.equal(range.interval, "day");
  });

  test("parses custom date range", () => {
    const range = parsePeriod("2026-01-01..2026-01-31");
    assert.equal(range.interval, "day");
    assert.equal(range.start.getFullYear(), 2026);
    assert.equal(range.start.getMonth(), 0);
    assert.equal(range.start.getDate(), 1);
    assert.equal(range.end.getDate(), 31);
    assert.equal(range.end.getHours(), 23);
  });

  test("parses year-long custom range (bug #2 regression)", () => {
    const range = parsePeriod("2025-05-01..2026-05-01");
    assert.equal(range.interval, "day");
    const days = (range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24);
    assert.ok(days >= 365 && days <= 366, `Expected ~365 days, got ${days}`);
  });

  test("2-day range uses hourly interval", () => {
    const range = parsePeriod("2026-04-01..2026-04-02");
    assert.equal(range.interval, "hour");
  });

  test("3-day range uses daily interval", () => {
    const range = parsePeriod("2026-04-01..2026-04-04");
    assert.equal(range.interval, "day");
  });

  test("throws on invalid period string", () => {
    assert.throws(() => parsePeriod("invalid"), /Invalid period/);
  });

  test("throws on malformed date range", () => {
    assert.throws(() => parsePeriod("2026-01-01..abc"), /Invalid period/);
  });
});

describe("getPreviousPeriod", () => {
  test("returns a period of the same length ending at the original start", () => {
    const range = parsePeriod("7d");
    const prev = getPreviousPeriod(range);
    assert.equal(prev.end.getTime(), range.start.getTime());
    const origDuration = range.end.getTime() - range.start.getTime();
    const prevDuration = prev.end.getTime() - prev.start.getTime();
    assert.equal(origDuration, prevDuration);
  });

  test("preserves interval", () => {
    const range = parsePeriod("today");
    const prev = getPreviousPeriod(range);
    assert.equal(prev.interval, "hour");
  });

  test("previous 7d period should not exceed 8 days total (regression)", () => {
    const range = parsePeriod("7d");
    const prev = getPreviousPeriod(range);
    const prevDays = (prev.end.getTime() - prev.start.getTime()) / (1000 * 60 * 60 * 24);
    // The previous period mirrors the current period duration.
    // Since "7d" starts at midnight but ends at "now", the duration is 7 + fraction.
    // This means the previous period is also 7 + fraction days — capturing extra data.
    // This test documents the current behaviour. If we fix getPreviousPeriod
    // to use clean day boundaries, update this assertion.
    assert.ok(prevDays >= 7, `Previous period should be at least 7 days, got ${prevDays}`);
    assert.ok(prevDays < 8, `Previous period should be less than 8 days, got ${prevDays}`);
  });

  test("previous period for custom date range has exact day boundaries", () => {
    const range = parsePeriod("2026-04-01..2026-04-07");
    const prev = getPreviousPeriod(range);
    const prevDays = (prev.end.getTime() - prev.start.getTime()) / (1000 * 60 * 60 * 24);
    // Custom ranges have setHours(23,59,59,999) on end, so duration includes the fractional day
    assert.ok(prevDays >= 6.9 && prevDays <= 7.1, `Expected ~7 days, got ${prevDays}`);
  });
});
