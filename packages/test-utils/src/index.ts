import { vi } from 'vitest';

/**
 * Mock Chrome API for extension testing
 */
export function mockChromeAPI() {
  const chrome = {
    runtime: {
      id: 'test-extension-id',
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    tabs: {
      query: vi.fn(),
      getCurrent: vi.fn(),
      sendMessage: vi.fn(),
    },
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
      },
    },
    action: {
      setIcon: vi.fn(),
      setBadgeText: vi.fn(),
    },
  };

  // @ts-expect-error - Mocking global chrome
  global.chrome = chrome;

  return chrome;
}

/**
 * Clear all Chrome API mocks
 */
export function clearChromeMocks() {
  vi.clearAllMocks();
}

/**
 * Mock IndexedDB instance for testing
 */
export function mockIndexedDB() {
  // fake-indexeddb is already setup globally in vitest.setup.ts
  return indexedDB;
}

/**
 * Wait for a specific amount of time (for async operations)
 */
export function wait(ms: number = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for next tick
 */
export function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
