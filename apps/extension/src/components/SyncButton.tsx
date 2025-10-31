import { useEffect, useState, useRef } from 'react';
import { Cloud, RefreshCw, CloudCheck } from 'lucide-react';

interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  error: string | null;
  pendingChanges: number;
}

export function SyncButton() {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    pendingChanges: 0,
  });
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const previousSyncingRef = useRef(false);
  const successTimeoutRef = useRef<number | null>(null);

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
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Watch for sync completion
  useEffect(() => {
    // If we were syncing and now we're not, and there's no error, show success
    if (previousSyncingRef.current && !status.isSyncing && !status.error) {
      setShowSuccess(true);

      // Clear any existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }

      // Hide success icon after 3 seconds
      successTimeoutRef.current = window.setTimeout(() => {
        setShowSuccess(false);
        successTimeoutRef.current = null;
      }, 3000);
    }

    previousSyncingRef.current = status.isSyncing;
  }, [status.isSyncing, status.error]);

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
    if (!isEnabled || status.isSyncing) return;
    chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' });
  }

  // Don't show button if sync is not enabled
  if (!isEnabled) {
    return null;
  }

  const formatLastSync = () => {
    if (!status.lastSyncTime) {
      return 'Last sync: Never';
    }

    const now = Date.now();
    const diff = now - status.lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return 'Last sync: Just now';
    } else if (minutes < 60) {
      return `Last sync: ${minutes}m ago`;
    } else if (hours < 24) {
      return `Last sync: ${hours}h ago`;
    } else {
      return `Last sync: ${days}d ago`;
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={status.isSyncing || showSuccess}
      className="p-2 rounded-lg transition-colors hover:bg-black/10 disabled:opacity-50 relative"
      title={formatLastSync()}
    >
      {status.isSyncing ? (
        <RefreshCw className="w-5 h-5 animate-spin" />
      ) : showSuccess ? (
        <CloudCheck className="w-5 h-5" />
      ) : (
        <Cloud className="w-5 h-5" />
      )}
      {status.pendingChanges > 0 && !status.isSyncing && !showSuccess && (
        <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-white text-[#ff751f] rounded-full flex items-center justify-center">
          {status.pendingChanges > 9 ? '9+' : status.pendingChanges}
        </span>
      )}
    </button>
  );
}
