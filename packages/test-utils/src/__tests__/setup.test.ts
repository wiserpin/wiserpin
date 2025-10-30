import { describe, it, expect } from "vitest";
import { mockChromeAPI, wait, nextTick } from "../index";

describe("Test Setup", () => {
  it("should be able to run tests", () => {
    expect(true).toBe(true);
  });

  it("should have vitest globals available", () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it("should mock Chrome API", () => {
    const chrome = mockChromeAPI();
    expect(chrome.runtime.id).toBe("test-extension-id");
    expect(chrome.tabs.query).toBeDefined();
  });

  it("should have IndexedDB available", () => {
    expect(indexedDB).toBeDefined();
    expect(typeof indexedDB.open).toBe("function");
  });

  it("should have wait utility", async () => {
    const start = Date.now();
    await wait(10);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(10);
  });

  it("should have nextTick utility", async () => {
    let executed = false;
    nextTick().then(() => {
      executed = true;
    });
    expect(executed).toBe(false);
    await nextTick();
    expect(executed).toBe(true);
  });
});
