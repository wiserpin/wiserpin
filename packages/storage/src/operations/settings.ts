import type { Settings } from '@wiserpin/core';
import { DEFAULT_SETTINGS } from '@wiserpin/core';
import { getDB, STORES } from '../db/schema';
import { TransactionError } from '../errors/storage-error';

/**
 * Settings key in IndexedDB
 */
const SETTINGS_KEY = 'user-settings';

/**
 * Get user settings
 */
export async function getSettings(): Promise<Settings> {
  try {
    const db = await getDB();
    const settings = await db.get(STORES.SETTINGS, SETTINGS_KEY);

    // Return default settings if none exist
    if (!settings) {
      await db.put(STORES.SETTINGS, DEFAULT_SETTINGS, SETTINGS_KEY);
      return DEFAULT_SETTINGS;
    }

    return settings;
  } catch (error) {
    throw new TransactionError('Failed to get settings', error);
  }
}

/**
 * Update user settings
 */
export async function updateSettings(
  updates: Partial<Settings>
): Promise<void> {
  try {
    const db = await getDB();
    const current = await getSettings();

    const updated: Settings = {
      ...current,
      ...updates,
    };

    await db.put(STORES.SETTINGS, updated, SETTINGS_KEY);
  } catch (error) {
    throw new TransactionError('Failed to update settings', error);
  }
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    const db = await getDB();
    await db.put(STORES.SETTINGS, DEFAULT_SETTINGS, SETTINGS_KEY);
  } catch (error) {
    throw new TransactionError('Failed to reset settings', error);
  }
}
