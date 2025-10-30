/// <reference types="vitest/globals" />

// Global type definitions for the monorepo

// IndexedDB globals (provided by fake-indexeddb in tests)
declare const indexedDB: IDBFactory;
declare const IDBKeyRange: typeof globalThis.IDBKeyRange;

// Chrome Extension API (will be mocked in tests)
declare namespace chrome {
  export namespace runtime {
    export const id: string;
    export function sendMessage(message: any): void;
    export const onMessage: {
      addListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
      removeListener(callback: (message: any, sender: any, sendResponse: any) => void): void;
    };
  }

  export namespace tabs {
    export function query(queryInfo: any): Promise<any[]>;
    export function getCurrent(): Promise<any>;
    export function sendMessage(tabId: number, message: any): Promise<any>;
  }

  export namespace storage {
    export const local: {
      get(keys?: string | string[] | null): Promise<any>;
      set(items: Record<string, any>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    };
    export const sync: {
      get(keys?: string | string[] | null): Promise<any>;
      set(items: Record<string, any>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    };
  }

  export namespace action {
    export function setIcon(details: any): Promise<void>;
    export function setBadgeText(details: any): Promise<void>;
  }
}
