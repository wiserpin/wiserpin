import { openDB, type IDBPDatabase } from 'idb';
import type { Collection, Pin, Settings } from '@wiserpin/core';
import { DEFAULT_SETTINGS } from '@wiserpin/core';
import { DatabaseInitError } from '../errors/storage-error';

/**
 * Database name
 */
export const DB_NAME = 'wiserpin-db';

/**
 * Current database version
 */
export const DB_VERSION = 1;

/**
 * Object store names
 */
export const STORES = {
  COLLECTIONS: 'collections',
  PINS: 'pins',
  SETTINGS: 'settings',
} as const;

/**
 * Database interface
 */
export interface WiserPinDB {
  collections: {
    key: string;
    value: Collection;
    indexes: { userId: string; updatedAt: string };
  };
  pins: {
    key: string;
    value: Pin;
    indexes: { collectionId: string; url: string; userId: string };
  };
  settings: {
    key: string;
    value: Settings;
  };
}

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBPDatabase<WiserPinDB>> {
  try {
    const db = await openDB<WiserPinDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Collections store
        if (!db.objectStoreNames.contains(STORES.COLLECTIONS)) {
          const collectionsStore = db.createObjectStore(STORES.COLLECTIONS, {
            keyPath: 'id',
          });
          collectionsStore.createIndex('userId', 'userId', { unique: false });
          collectionsStore.createIndex('updatedAt', 'updatedAt', {
            unique: false,
          });
        }

        // Pins store
        if (!db.objectStoreNames.contains(STORES.PINS)) {
          const pinsStore = db.createObjectStore(STORES.PINS, {
            keyPath: 'id',
          });
          pinsStore.createIndex('collectionId', 'collectionId', {
            unique: false,
          });
          pinsStore.createIndex('url', 'page.url', { unique: false });
          pinsStore.createIndex('userId', 'userId', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          const settingsStore = db.createObjectStore(STORES.SETTINGS);

          // Initialize default settings
          settingsStore.put(DEFAULT_SETTINGS, 'user-settings');
        }
      },
    });

    return db;
  } catch (error) {
    throw new DatabaseInitError('Failed to initialize database', error);
  }
}

/**
 * Get database instance (singleton pattern)
 */
let dbInstance: IDBPDatabase<WiserPinDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<WiserPinDB>> {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
