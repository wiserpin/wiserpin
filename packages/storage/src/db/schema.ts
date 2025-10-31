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
 * v2: Removed unique constraint on URL to allow same page in multiple collections
 */
export const DB_VERSION = 2;

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
      upgrade(db, oldVersion, newVersion, _transaction) {
        console.debug(`[WiserPin DB] Upgrading from v${oldVersion} to v${newVersion}`);

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

        // Pins store - recreate if upgrading from v1 to remove unique constraint
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains(STORES.PINS)) {
            console.debug('[WiserPin DB] Recreating pins store to remove URL unique constraint');
            db.deleteObjectStore(STORES.PINS);
          }
        }

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

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([STORES.COLLECTIONS, STORES.PINS], 'readwrite');

  await Promise.all([
    tx.objectStore(STORES.COLLECTIONS).clear(),
    tx.objectStore(STORES.PINS).clear(),
    tx.done,
  ]);

  console.log('[WiserPin DB] All data cleared');
}
