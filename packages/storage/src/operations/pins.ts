import type { Pin, CreatePinInput, PinFilter } from '@wiserpin/core';
import { getDB, STORES } from '../db/schema';
import {
  NotFoundError,
  TransactionError,
  DuplicateError,
} from '../errors/storage-error';

/**
 * Generate a unique ID for a pin
 */
function generateId(): string {
  return `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a pin with the given URL already exists
 */
export async function checkPinExists(url: string): Promise<boolean> {
  try {
    const db = await getDB();
    const pins = await db.getAllFromIndex(STORES.PINS, 'url', url);
    return pins.length > 0;
  } catch (error) {
    throw new TransactionError('Failed to check pin existence', error);
  }
}

/**
 * Add a new pin
 */
export async function addPin(input: CreatePinInput): Promise<string> {
  try {
    // Check for duplicate URL
    const exists = await checkPinExists(input.page.url);
    if (exists) {
      throw new DuplicateError('Pin', 'url', input.page.url);
    }

    const db = await getDB();
    const now = new Date().toISOString();

    const pin: Pin = {
      ...input,
      id: generateId(),
      createdAt: now,
    };

    await db.add(STORES.PINS, pin);
    return pin.id;
  } catch (error) {
    if (error instanceof DuplicateError) {
      throw error;
    }
    throw new TransactionError('Failed to add pin', error);
  }
}

/**
 * Get a pin by ID
 */
export async function getPin(id: string): Promise<Pin | undefined> {
  try {
    const db = await getDB();
    return await db.get(STORES.PINS, id);
  } catch (error) {
    throw new TransactionError('Failed to get pin', error);
  }
}

/**
 * List all pins
 */
export async function listPins(): Promise<Pin[]> {
  try {
    const db = await getDB();
    return await db.getAll(STORES.PINS);
  } catch (error) {
    throw new TransactionError('Failed to list pins', error);
  }
}

/**
 * List pins by collection ID
 */
export async function listPinsByCollection(
  collectionId: string
): Promise<Pin[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex(
      STORES.PINS,
      'collectionId',
      collectionId
    );
  } catch (error) {
    throw new TransactionError('Failed to list pins by collection', error);
  }
}

/**
 * List pins by user ID
 */
export async function listPinsByUser(userId: string): Promise<Pin[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex(STORES.PINS, 'userId', userId);
  } catch (error) {
    throw new TransactionError('Failed to list pins by user', error);
  }
}

/**
 * Query pins with filters
 */
export async function queryPins(filter: PinFilter): Promise<Pin[]> {
  try {
    let pins: Pin[];

    if (filter.collectionId) {
      pins = await listPinsByCollection(filter.collectionId);
    } else if (filter.userId) {
      pins = await listPinsByUser(filter.userId);
    } else if (filter.url) {
      const db = await getDB();
      pins = await db.getAllFromIndex(STORES.PINS, 'url', filter.url);
    } else {
      pins = await listPins();
    }

    // Apply search filter if provided
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      pins = pins.filter(
        (pin) =>
          pin.page.title?.toLowerCase().includes(searchLower) ||
          pin.note?.toLowerCase().includes(searchLower)
      );
    }

    return pins;
  } catch (error) {
    throw new TransactionError('Failed to query pins', error);
  }
}

/**
 * Update a pin
 */
export async function updatePin(
  id: string,
  updates: Partial<Omit<Pin, 'id' | 'collectionId' | 'createdAt'>>
): Promise<void> {
  try {
    const db = await getDB();
    const existing = await db.get(STORES.PINS, id);

    if (!existing) {
      throw new NotFoundError('Pin', id);
    }

    const updated: Pin = {
      ...existing,
      ...updates,
      id: existing.id,
      collectionId: existing.collectionId,
      createdAt: existing.createdAt,
    };

    await db.put(STORES.PINS, updated);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new TransactionError('Failed to update pin', error);
  }
}

/**
 * Delete a pin
 */
export async function deletePin(id: string): Promise<void> {
  try {
    const db = await getDB();
    const existing = await db.get(STORES.PINS, id);

    if (!existing) {
      throw new NotFoundError('Pin', id);
    }

    await db.delete(STORES.PINS, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new TransactionError('Failed to delete pin', error);
  }
}

/**
 * Delete all pins in a collection
 */
export async function deletePinsByCollection(
  collectionId: string
): Promise<number> {
  try {
    const pins = await listPinsByCollection(collectionId);
    const db = await getDB();

    for (const pin of pins) {
      await db.delete(STORES.PINS, pin.id);
    }

    return pins.length;
  } catch (error) {
    throw new TransactionError('Failed to delete pins by collection', error);
  }
}

/**
 * Get pin count
 */
export async function getPinCount(): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(STORES.PINS);
  } catch (error) {
    throw new TransactionError('Failed to get pin count', error);
  }
}

/**
 * Get pin count by collection
 */
export async function getPinCountByCollection(
  collectionId: string
): Promise<number> {
  try {
    const db = await getDB();
    return await db.countFromIndex(STORES.PINS, 'collectionId', collectionId);
  } catch (error) {
    throw new TransactionError(
      'Failed to get pin count by collection',
      error
    );
  }
}
