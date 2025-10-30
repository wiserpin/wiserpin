import type { Collection, CreateCollectionInput } from '@wiserpin/core';
import { getDB, STORES } from '../db/schema';
import { NotFoundError, TransactionError } from '../errors/storage-error';

/**
 * Generate a unique ID for a collection
 */
function generateId(): string {
  return `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add a new collection
 */
export async function addCollection(
  input: CreateCollectionInput
): Promise<string> {
  try {
    const db = await getDB();
    const now = new Date().toISOString();

    const collection: Collection = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    await db.add(STORES.COLLECTIONS, collection);
    return collection.id;
  } catch (error) {
    throw new TransactionError('Failed to add collection', error);
  }
}

/**
 * Get a collection by ID
 */
export async function getCollection(
  id: string
): Promise<Collection | undefined> {
  try {
    const db = await getDB();
    return await db.get(STORES.COLLECTIONS, id);
  } catch (error) {
    throw new TransactionError('Failed to get collection', error);
  }
}

/**
 * List all collections
 */
export async function listCollections(): Promise<Collection[]> {
  try {
    const db = await getDB();
    return await db.getAll(STORES.COLLECTIONS);
  } catch (error) {
    throw new TransactionError('Failed to list collections', error);
  }
}

/**
 * List collections by user ID
 */
export async function listCollectionsByUser(
  userId: string
): Promise<Collection[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex(STORES.COLLECTIONS, 'userId', userId);
  } catch (error) {
    throw new TransactionError('Failed to list collections by user', error);
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  id: string,
  updates: Partial<Omit<Collection, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const db = await getDB();
    const existing = await db.get(STORES.COLLECTIONS, id);

    if (!existing) {
      throw new NotFoundError('Collection', id);
    }

    const updated: Collection = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    await db.put(STORES.COLLECTIONS, updated);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new TransactionError('Failed to update collection', error);
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: string): Promise<void> {
  try {
    const db = await getDB();
    const existing = await db.get(STORES.COLLECTIONS, id);

    if (!existing) {
      throw new NotFoundError('Collection', id);
    }

    await db.delete(STORES.COLLECTIONS, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new TransactionError('Failed to delete collection', error);
  }
}

/**
 * Get collection count
 */
export async function getCollectionCount(): Promise<number> {
  try {
    const db = await getDB();
    return await db.count(STORES.COLLECTIONS);
  } catch (error) {
    throw new TransactionError('Failed to get collection count', error);
  }
}
