import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
  pendingChanges: number;
}

export function SyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    pendingChanges: 0,
  });
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Load initial status
    loadStatus();

    // Listen for sync status changes
    const listener = (message: any) => {
      if (message.type === 'SYNC_STATUS_CHANGED') {
        setStatus(message.status);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  async function loadStatus() {
    const result = await chrome.storage.local.get(['wiserpin_sync_status', 'wiserpin_sync_settings']);
    if (result.wiserpin_sync_status) {
      setStatus(result.wiserpin_sync_status);
    }
    if (result.wiserpin_sync_settings) {
      setIsEnabled(result.wiserpin_sync_settings.enabled);
    }
  }

  async function handleSync() {
    chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' });
  }

  if (!isEnabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground bg-muted/50 rounded-md">
        <CloudOff className="w-3 h-3" />
        <span>Cloud sync disabled</span>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-destructive bg-destructive/10 rounded-md">
        <AlertCircle className="w-3 h-3" />
        <span>{status.error}</span>
      </div>
    );
  }

  if (status.isSyncing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-primary bg-primary/10 rounded-md">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  const lastSyncText = status.lastSyncTime
    ? new Date(status.lastSyncTime).toLocaleTimeString()
    : 'Never';

  return (
    <button
      onClick={handleSync}
      className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
      title="Click to sync now"
    >
      <Cloud className="w-3 h-3" />
      <span>Last sync: {lastSyncText}</span>
      {status.pendingChanges > 0 && (
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded">
          {status.pendingChanges}
        </span>
      )}
    </button>
  );
}
