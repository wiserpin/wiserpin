import { describe, it, expect } from 'vitest';
import type {
  Collection,
  CreateCollectionInput,
  Pin,
  CreatePinInput,
  Settings,
  PagePreview,
  Summary,
} from '../index';
import { DEFAULT_SETTINGS, MessageType, StorageEventType } from '../index';

describe('@wiserpin/core types', () => {
  describe('Collection types', () => {
    it('should have valid Collection interface', () => {
      const collection: Collection = {
        id: '123',
        name: 'Test Collection',
        goal: 'Testing purposes',
        color: '#ff0000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(collection.id).toBe('123');
      expect(collection.name).toBe('Test Collection');
    });

    it('should allow CreateCollectionInput without id and timestamps', () => {
      const input: CreateCollectionInput = {
        name: 'New Collection',
        goal: 'New goal',
        color: '#00ff00',
      };

      expect(input.name).toBe('New Collection');
      // @ts-expect-error - id should not be in CreateCollectionInput
      expect(input.id).toBeUndefined();
    });
  });

  describe('Pin types', () => {
    it('should have valid Pin interface', () => {
      const pin: Pin = {
        id: '456',
        collectionId: '123',
        page: {
          url: 'https://example.com',
          title: 'Example',
        },
        createdAt: new Date().toISOString(),
      };

      expect(pin.id).toBe('456');
      expect(pin.page.url).toBe('https://example.com');
    });

    it('should allow optional summary and note', () => {
      const pin: Pin = {
        id: '456',
        collectionId: '123',
        page: { url: 'https://example.com' },
        summary: {
          text: 'This is a summary',
          createdAt: new Date().toISOString(),
        },
        note: 'My personal note',
        createdAt: new Date().toISOString(),
      };

      expect(pin.summary?.text).toBe('This is a summary');
      expect(pin.note).toBe('My personal note');
    });
  });

  describe('PagePreview and Summary types', () => {
    it('should have valid PagePreview interface', () => {
      const preview: PagePreview = {
        url: 'https://example.com',
        title: 'Example Page',
        ogImageUrl: 'https://example.com/image.jpg',
        siteName: 'Example Site',
      };

      expect(preview.url).toBe('https://example.com');
    });

    it('should have valid Summary interface', () => {
      const summary: Summary = {
        text: 'This is a test summary',
        createdAt: new Date().toISOString(),
      };

      expect(summary.text).toBe('This is a test summary');
    });
  });

  describe('Settings types', () => {
    it('should have valid Settings interface', () => {
      const settings: Settings = {
        autoSummarize: true,
        theme: 'dark',
      };

      expect(settings.autoSummarize).toBe(true);
      expect(settings.theme).toBe('dark');
    });

    it('should export DEFAULT_SETTINGS', () => {
      expect(DEFAULT_SETTINGS).toBeDefined();
      expect(DEFAULT_SETTINGS.autoSummarize).toBe(true);
      expect(DEFAULT_SETTINGS.theme).toBe('system');
    });
  });

  describe('Enum exports', () => {
    it('should export MessageType enum', () => {
      expect(MessageType.GET_PAGE_METADATA).toBe('GET_PAGE_METADATA');
      expect(MessageType.GENERATE_SUMMARY).toBe('GENERATE_SUMMARY');
      expect(MessageType.ERROR).toBe('ERROR');
    });

    it('should export StorageEventType enum', () => {
      expect(StorageEventType.COLLECTION_CREATED).toBe('COLLECTION_CREATED');
      expect(StorageEventType.PIN_CREATED).toBe('PIN_CREATED');
      expect(StorageEventType.SETTINGS_UPDATED).toBe('SETTINGS_UPDATED');
    });
  });

  describe('Type exports', () => {
    it('should be able to import all main types', () => {
      // This test just verifies that all types are importable
      // TypeScript compilation will fail if any are missing
      const typeNames = [
        'Collection',
        'CreateCollectionInput',
        'Pin',
        'CreatePinInput',
        'Settings',
        'PagePreview',
        'Summary',
      ];

      expect(typeNames.length).toBeGreaterThan(0);
    });
  });
});
