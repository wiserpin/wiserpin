import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach } from 'vitest';
import { closeDB } from './src/db/schema';

// Create a fresh IndexedDB instance for each test
beforeEach(() => {
  closeDB(); // Clear the singleton
  // @ts-expect-error - Replace global indexedDB with fresh instance
  global.indexedDB = new IDBFactory();
});

afterEach(() => {
  closeDB(); // Clear the singleton
  // Clean up
  // @ts-expect-error
  global.indexedDB = new IDBFactory();
});
