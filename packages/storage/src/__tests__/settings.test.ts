import { describe, it, expect, beforeEach } from 'vitest';
import { DEFAULT_SETTINGS } from '@wiserpin/core';
import {
  getSettings,
  updateSettings,
  resetSettings,
} from '../operations/settings';
import { initDB } from '../db/schema';

describe('Settings Operations', () => {
  beforeEach(async () => {
    await initDB();
  });

  describe('getSettings', () => {
    it('should return default settings initially', async () => {
      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      await updateSettings({ autoSummarize: false });

      const settings = await getSettings();
      expect(settings.autoSummarize).toBe(false);
    });

    it('should partially update settings', async () => {
      await updateSettings({ autoSummarize: false });
      await updateSettings({ theme: 'dark' });

      const settings = await getSettings();
      expect(settings.autoSummarize).toBe(false);
      expect(settings.theme).toBe('dark');
    });
  });

  describe('resetSettings', () => {
    it('should reset to defaults', async () => {
      await updateSettings({ autoSummarize: false, theme: 'dark' });
      await resetSettings();

      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });
});
