import { describe, it, expect, beforeEach } from 'vitest';
import type { CreateCollectionInput } from '@wiserpin/core';
import {
  addCollection,
  getCollection,
  listCollections,
  updateCollection,
  deleteCollection,
  getCollectionCount,
} from '../operations/collections';
import { NotFoundError } from '../errors/storage-error';
import { initDB } from '../db/schema';

describe('Collection Operations', () => {
  beforeEach(async () => {
    // Initialize database before each test
    await initDB();
  });

  describe('addCollection', () => {
    it('should add a new collection', async () => {
      const input: CreateCollectionInput = {
        name: 'Test Collection',
        goal: 'Testing purposes',
        color: '#ff0000',
      };

      const id = await addCollection(input);

      expect(id).toBeDefined();
      expect(id).toMatch(/^col_/);

      const collection = await getCollection(id);
      expect(collection).toBeDefined();
      expect(collection?.name).toBe(input.name);
      expect(collection?.goal).toBe(input.goal);
      expect(collection?.color).toBe(input.color);
      expect(collection?.createdAt).toBeDefined();
      expect(collection?.updatedAt).toBeDefined();
    });

    it('should add collection without optional fields', async () => {
      const input: CreateCollectionInput = {
        name: 'Minimal Collection',
        goal: 'Test',
      };

      const id = await addCollection(input);
      const collection = await getCollection(id);

      expect(collection?.color).toBeUndefined();
      expect(collection?.userId).toBeUndefined();
    });
  });

  describe('getCollection', () => {
    it('should return undefined for non-existent collection', async () => {
      const collection = await getCollection('non-existent-id');
      expect(collection).toBeUndefined();
    });

    it('should retrieve an existing collection', async () => {
      const id = await addCollection({
        name: 'Test',
        goal: 'Goal',
      });

      const collection = await getCollection(id);
      expect(collection).toBeDefined();
      expect(collection?.id).toBe(id);
    });
  });

  describe('listCollections', () => {
    it('should return empty array when no collections', async () => {
      const collections = await listCollections();
      expect(collections).toEqual([]);
    });

    it('should list all collections', async () => {
      await addCollection({ name: 'Collection 1', goal: 'Goal 1' });
      await addCollection({ name: 'Collection 2', goal: 'Goal 2' });
      await addCollection({ name: 'Collection 3', goal: 'Goal 3' });

      const collections = await listCollections();
      expect(collections).toHaveLength(3);
      expect(collections.map((c) => c.name)).toContain('Collection 1');
      expect(collections.map((c) => c.name)).toContain('Collection 2');
      expect(collections.map((c) => c.name)).toContain('Collection 3');
    });
  });

  describe('updateCollection', () => {
    it('should update collection fields', async () => {
      const id = await addCollection({
        name: 'Original',
        goal: 'Original Goal',
      });

      await updateCollection(id, {
        name: 'Updated',
        color: '#00ff00',
      });

      const updated = await getCollection(id);
      expect(updated?.name).toBe('Updated');
      expect(updated?.color).toBe('#00ff00');
      expect(updated?.goal).toBe('Original Goal'); // Unchanged
    });

    it('should update updatedAt timestamp', async () => {
      const id = await addCollection({
        name: 'Test',
        goal: 'Test',
      });

      const original = await getCollection(id);
      const originalUpdatedAt = original?.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await updateCollection(id, { name: 'Updated' });

      const updated = await getCollection(id);
      expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should throw NotFoundError for non-existent collection', async () => {
      await expect(
        updateCollection('non-existent', { name: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteCollection', () => {
    it('should delete an existing collection', async () => {
      const id = await addCollection({
        name: 'To Delete',
        goal: 'Will be deleted',
      });

      await deleteCollection(id);

      const deleted = await getCollection(id);
      expect(deleted).toBeUndefined();
    });

    it('should throw NotFoundError for non-existent collection', async () => {
      await expect(deleteCollection('non-existent')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should decrease collection count after deletion', async () => {
      const id1 = await addCollection({ name: 'C1', goal: 'G1' });
      await addCollection({ name: 'C2', goal: 'G2' });

      let count = await getCollectionCount();
      expect(count).toBe(2);

      await deleteCollection(id1);

      count = await getCollectionCount();
      expect(count).toBe(1);
    });
  });

  describe('getCollectionCount', () => {
    it('should return 0 when no collections', async () => {
      const count = await getCollectionCount();
      expect(count).toBe(0);
    });

    it('should return correct count', async () => {
      await addCollection({ name: 'C1', goal: 'G1' });
      await addCollection({ name: 'C2', goal: 'G2' });

      const count = await getCollectionCount();
      expect(count).toBe(2);
    });
  });
});
