import { describe, it, expect, beforeEach } from 'vitest';
import type { CreatePinInput } from '@wiserpin/core';
import {
  addPin,
  getPin,
  listPins,
  listPinsByCollection,
  updatePin,
  deletePin,
  checkPinExists,
  getPinCount,
} from '../operations/pins';
import { addCollection } from '../operations/collections';
import { NotFoundError, DuplicateError } from '../errors/storage-error';
import { initDB } from '../db/schema';

describe('Pin Operations', () => {
  let collectionId: string;

  beforeEach(async () => {
    await initDB();
    collectionId = await addCollection({
      name: 'Test Collection',
      goal: 'Testing',
    });
  });

  describe('addPin', () => {
    it('should add a new pin', async () => {
      const input: CreatePinInput = {
        collectionId,
        page: {
          url: 'https://example.com',
          title: 'Example',
        },
      };

      const id = await addPin(input);
      expect(id).toMatch(/^pin_/);

      const pin = await getPin(id);
      expect(pin?.page.url).toBe(input.page.url);
    });

    it('should reject duplicate URL', async () => {
      const input: CreatePinInput = {
        collectionId,
        page: { url: 'https://example.com' },
      };

      await addPin(input);
      await expect(addPin(input)).rejects.toThrow(DuplicateError);
    });
  });

  describe('checkPinExists', () => {
    it('should return false for non-existent URL', async () => {
      const exists = await checkPinExists('https://nonexistent.com');
      expect(exists).toBe(false);
    });

    it('should return true for existing URL', async () => {
      await addPin({
        collectionId,
        page: { url: 'https://exists.com' },
      });

      const exists = await checkPinExists('https://exists.com');
      expect(exists).toBe(true);
    });
  });

  describe('listPinsByCollection', () => {
    it('should list pins in a collection', async () => {
      await addPin({
        collectionId,
        page: { url: 'https://pin1.com' },
      });
      await addPin({
        collectionId,
        page: { url: 'https://pin2.com' },
      });

      const pins = await listPinsByCollection(collectionId);
      expect(pins).toHaveLength(2);
    });
  });

  describe('updatePin', () => {
    it('should update pin note', async () => {
      const id = await addPin({
        collectionId,
        page: { url: 'https://test.com' },
      });

      await updatePin(id, { note: 'Updated note' });

      const updated = await getPin(id);
      expect(updated?.note).toBe('Updated note');
    });

    it('should throw NotFoundError', async () => {
      await expect(
        updatePin('non-existent', { note: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deletePin', () => {
    it('should delete a pin', async () => {
      const id = await addPin({
        collectionId,
        page: { url: 'https://delete.com' },
      });

      await deletePin(id);
      const deleted = await getPin(id);
      expect(deleted).toBeUndefined();
    });
  });

  describe('getPinCount', () => {
    it('should return correct count', async () => {
      await addPin({
        collectionId,
        page: { url: 'https://pin1.com' },
      });
      await addPin({
        collectionId,
        page: { url: 'https://pin2.com' },
      });

      const count = await getPinCount();
      expect(count).toBe(2);
    });
  });
});
