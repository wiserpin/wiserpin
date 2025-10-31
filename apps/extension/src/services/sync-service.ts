/**
 * Cloud Sync Service
 *
 * Synchronizes data between local IndexedDB and the WiserPin API
 */

import { listCollections, listPins, addCollection, addPin } from '@wiserpin/storage';
import { api } from './api-client';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
  pendingChanges: number;
}

export interface SyncSettings {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  wifiOnly: boolean;
}

const SYNC_STORAGE_KEY = 'wiserpin_sync_status';
const SYNC_SETTINGS_KEY = 'wiserpin_sync_settings';

const DEFAULT_SETTINGS: SyncSettings = {
  enabled: false,
  autoSync: true,
  syncInterval: 5,
  wifiOnly: false,
};

class SyncService {
  private syncInProgress = false;
  private syncTimer: number | null = null;

  /**
   * Initialize sync service
   */
  async initialize() {
    const settings = await this.getSettings();
    if (settings.enabled && settings.autoSync) {
      this.startAutoSync();
    }

    // Sync on startup if enabled
    if (settings.enabled) {
      this.sync();
    }
  }

  /**
   * Get sync settings
   */
  async getSettings(): Promise<SyncSettings> {
    const result = await chrome.storage.local.get([SYNC_SETTINGS_KEY]);
    return result[SYNC_SETTINGS_KEY] || DEFAULT_SETTINGS;
  }

  /**
   * Update sync settings
   */
  async updateSettings(settings: Partial<SyncSettings>) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await chrome.storage.local.set({ [SYNC_SETTINGS_KEY]: updated });

    // Restart auto-sync if settings changed
    if (updated.enabled && updated.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }

    return updated;
  }

  /**
   * Get sync status
   */
  async getStatus(): Promise<SyncStatus> {
    const result = await chrome.storage.local.get([SYNC_STORAGE_KEY]);
    return result[SYNC_STORAGE_KEY] || {
      isSyncing: false,
      lastSyncTime: null,
      error: null,
      pendingChanges: 0,
    };
  }

  /**
   * Update sync status
   */
  private async updateStatus(status: Partial<SyncStatus>) {
    const current = await this.getStatus();
    const updated = { ...current, ...status };
    await chrome.storage.local.set({ [SYNC_STORAGE_KEY]: updated });

    // Notify popup of status change
    chrome.runtime.sendMessage({
      type: 'SYNC_STATUS_CHANGED',
      status: updated,
    }).catch(() => {
      // Popup might not be open, ignore error
    });
  }

  /**
   * Start auto-sync timer
   */
  private startAutoSync() {
    this.stopAutoSync();

    const settings = this.getSettings();
    settings.then((s) => {
      if (s.enabled && s.autoSync) {
        const intervalMs = s.syncInterval * 60 * 1000;
        this.syncTimer = window.setInterval(() => {
          this.sync();
        }, intervalMs);
      }
    });
  }

  /**
   * Stop auto-sync timer
   */
  private stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Perform full sync (push + pull)
   */
  async sync(): Promise<void> {
    console.log('[SyncService] Starting sync...');
    const settings = await this.getSettings();

    if (!settings.enabled) {
      console.log('[SyncService] Sync is disabled');
      throw new Error('Sync is disabled');
    }

    if (this.syncInProgress) {
      console.log('[SyncService] Sync already in progress, skipping');
      return;
    }

    this.syncInProgress = true;
    await this.updateStatus({ isSyncing: true, error: null });

    try {
      // Check if online
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      // Check if we have a token
      const result = await chrome.storage.local.get(['clerk_session_token']);
      const token = result.clerk_session_token;
      console.log('[SyncService] Token exists:', !!token);
      if (!token) {
        throw new Error('Not authenticated - please sign in first');
      }

      // Pull remote changes from cloud FIRST to avoid duplicates
      console.log('[SyncService] Pulling remote changes...');
      await this.pullChanges();

      // Then push local changes to cloud
      console.log('[SyncService] Pushing local changes...');
      await this.pushChanges();

      // Update sync status
      await this.updateStatus({
        isSyncing: false,
        lastSyncTime: Date.now(),
        error: null,
        pendingChanges: 0,
      });

      console.log('[SyncService] Sync completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';

      // Don't show auth errors to user - they're handled by the background script
      const isAuthError = errorMessage.includes('Invalid or expired token') ||
                         errorMessage.includes('Not authenticated');

      await this.updateStatus({
        isSyncing: false,
        error: isAuthError ? null : errorMessage,
      });

      console.error('[SyncService] Sync error:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Push local changes to cloud (only push items not already on server)
   */
  private async pushChanges(): Promise<void> {
    // Get all local pins and collections
    const [localPins, localCollections] = await Promise.all([
      listPins(),
      listCollections(),
    ]);

    // Get all remote pins and collections to compare
    const [remotePins, remoteCollections] = await Promise.all([
      api.pins.list() as Promise<any[]>,
      api.collections.list() as Promise<any[]>,
    ]);

    const remoteCollectionIds = new Set(remoteCollections.map(c => c.id));
    const remotePinIds = new Set(remotePins.map(p => p.id));

    console.log(`[SyncService] Push: ${localCollections.length} local collections (${remoteCollections.length} remote), ${localPins.length} local pins (${remotePins.length} remote)`);

    // Push only NEW collections (not on server)
    let pushedCollections = 0;
    for (const collection of localCollections) {
      // Skip if already exists on server
      if (remoteCollectionIds.has(collection.id)) {
        console.log(`[SyncService] Skipping collection already on server: ${collection.id}`);
        continue;
      }

      try {
        const apiCollection = {
          id: collection.id,
          name: collection.name,
          description: collection.goal,
          color: collection.color,
        };
        console.log(`[SyncService] Pushing NEW collection to cloud: ${collection.id} - ${collection.name}`);
        await api.collections.create(apiCollection as any);
        pushedCollections++;
      } catch (error) {
        console.error(`[SyncService] Failed to push collection ${collection.id}:`, error);
      }
    }
    console.log(`[SyncService] Pushed ${pushedCollections} new collections to cloud`);

    // Push only NEW pins (not on server)
    let pushedPins = 0;
    for (const pin of localPins) {
      // Skip if already exists on server
      if (remotePinIds.has(pin.id)) {
        console.log(`[SyncService] Skipping pin already on server: ${pin.id}`);
        continue;
      }

      // Skip invalid pins
      if (!pin.collectionId || !pin.page?.url) {
        console.log(`[SyncService] Skipping invalid pin ${pin.id}`);
        continue;
      }

      try {
        const apiPin = {
          id: pin.id,
          url: pin.page.url,
          title: pin.page.title || '',
          description: pin.summary?.text || pin.note,
          imageUrl: pin.page.ogImageUrl || undefined,
          tags: [],
          collectionId: pin.collectionId,
        };
        console.log(`[SyncService] Pushing NEW pin to cloud: ${pin.id}`);
        console.log(`[SyncService] Pin data:`, {
          id: pin.id,
          title: pin.page.title,
          ogImageUrl: pin.page.ogImageUrl,
          hasOgImage: !!pin.page.ogImageUrl,
        });
        console.log(`[SyncService] API pin data:`, apiPin);
        await api.pins.create(apiPin as any);
        pushedPins++;
      } catch (error) {
        console.error(`[SyncService] Failed to push pin ${pin.id}:`, error);
      }
    }
    console.log(`[SyncService] Pushed ${pushedPins} new pins to cloud`);
  }

  /**
   * Pull remote changes from cloud (only new items not in local)
   */
  private async pullChanges(): Promise<void> {
    // Fetch all data from API
    const [remotePins, remoteCollections] = await Promise.all([
      api.pins.list() as Promise<any[]>,
      api.collections.list() as Promise<any[]>,
    ]);

    // Get local data to compare
    const [localPins, localCollections] = await Promise.all([
      listPins(),
      listCollections(),
    ]);

    const localCollectionIds = new Set(localCollections.map(c => c.id));
    const localPinIds = new Set(localPins.map(p => p.id));

    console.log(`[SyncService] Pull: ${remoteCollections.length} remote collections, ${localCollections.length} local collections`);
    console.log(`[SyncService] Pull: ${remotePins.length} remote pins, ${localPins.length} local pins`);

    // Add only NEW collections from cloud (not in local)
    let pulledCollections = 0;
    for (const remoteCollection of remoteCollections) {
      if (!localCollectionIds.has(remoteCollection.id)) {
        const localCollection = {
          id: remoteCollection.id,
          name: remoteCollection.name,
          goal: remoteCollection.description || '',
          color: remoteCollection.color || '#6366f1',
          createdAt: remoteCollection.createdAt || new Date().toISOString(),
        };
        console.log(`[SyncService] Pulling new collection from cloud: ${remoteCollection.id}`);
        await addCollection(localCollection);
        pulledCollections++;
      }
    }
    console.log(`[SyncService] Pulled ${pulledCollections} new collections from cloud`);

    // Add only NEW pins from cloud (not in local)
    let pulledPins = 0;
    for (const remotePin of remotePins) {
      if (!localPinIds.has(remotePin.id)) {
        const localPin = {
          id: remotePin.id,
          collectionId: remotePin.collectionId || '',
          page: {
            url: remotePin.url,
            title: remotePin.title,
            ogImageUrl: remotePin.imageUrl,
            siteName: undefined,
          },
          summary: remotePin.description ? {
            text: remotePin.description,
            createdAt: remotePin.createdAt || new Date().toISOString(),
          } : undefined,
          note: remotePin.description || '',
          createdAt: remotePin.createdAt || new Date().toISOString(),
        };
        console.log(`[SyncService] Pulling new pin from cloud: ${remotePin.id}`);
        await addPin(localPin);
        pulledPins++;
      }
    }
    console.log(`[SyncService] Pulled ${pulledPins} new pins from cloud`);
  }

  /**
   * Enable cloud sync and perform initial sync
   */
  async enable(): Promise<void> {
    await this.updateSettings({ enabled: true });
    await this.sync();
  }

  /**
   * Disable cloud sync
   */
  async disable(): Promise<void> {
    await this.updateSettings({ enabled: false });
    this.stopAutoSync();
  }
}

export const syncService = new SyncService();
