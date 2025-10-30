import type { Collection } from './collection';
import type { Pin } from './pin';
import type { Settings } from './settings';

/**
 * Storage operation result
 */
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Storage database schema
 */
export interface StorageSchema {
  collections: Collection;
  pins: Pin;
  settings: Settings;
}

/**
 * Storage query options
 */
export interface QueryOptions {
  /** Limit number of results */
  limit?: number;

  /** Offset for pagination */
  offset?: number;

  /** Sort field */
  sortBy?: string;

  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter options for querying pins
 */
export interface PinFilter {
  /** Filter by collection ID */
  collectionId?: string;

  /** Filter by user ID */
  userId?: string;

  /** Filter by URL (exact match) */
  url?: string;

  /** Search in title or note */
  search?: string;
}

/**
 * Storage events for reactivity
 */
export enum StorageEventType {
  COLLECTION_CREATED = 'COLLECTION_CREATED',
  COLLECTION_UPDATED = 'COLLECTION_UPDATED',
  COLLECTION_DELETED = 'COLLECTION_DELETED',
  PIN_CREATED = 'PIN_CREATED',
  PIN_UPDATED = 'PIN_UPDATED',
  PIN_DELETED = 'PIN_DELETED',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
}

/**
 * Storage event payload
 */
export interface StorageEvent<T = unknown> {
  type: StorageEventType;
  data: T;
  timestamp: string;
}
