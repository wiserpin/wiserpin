/**
 * Background Service Worker
 * Handles extension lifecycle, context menu, message passing, and cloud sync
 */

import { syncService } from '../services/sync-service';
import { createClerkClient } from '@clerk/chrome-extension/background';

console.debug('WiserPin background service worker loaded');

// Initialize Clerk client for background
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  console.error('Missing Clerk Publishable Key');
}

// Keep reference to Clerk client for token refresh
let clerkClient: any = null;

// Helper function to refresh and save token
async function refreshAndSaveToken() {
  if (clerkClient?.session) {
    try {
      // Get a fresh token (without template to get the default JWT)
      const token = await clerkClient.session.getToken();
      if (token) {
        await chrome.storage.local.set({ clerk_session_token: token });
        console.debug('[Background] Clerk token refreshed and saved.');
        return token;
      } else {
        console.error('[Background] getToken returned null');
      }
    } catch (error) {
      console.error('[Background] Failed to refresh token:', error);
    }
  } else {
    console.error('[Background] No Clerk session available');
  }
  return null;
}

// Initialize Clerk and listen for auth changes
createClerkClient({
  publishableKey: PUBLISHABLE_KEY || '',
  syncHost: 'http://localhost:3000',
}).then((clerk) => {
  clerkClient = clerk;
  console.debug('[Background] Clerk client initialized');

  // Save initial token if already authenticated
  if (clerk.session) {
    refreshAndSaveToken();
  }

  // Listen for auth state changes and update token storage
  clerk.addListener((clerkInstance) => {
    console.debug('[Background] Clerk auth state changed:', { hasSession: !!clerkInstance.session });
    if (clerkInstance.session) {
      // User is signed in, save token for API calls
      refreshAndSaveToken();
    } else {
      // User signed out, clear token
      chrome.storage.local.remove(['clerk_session_token']);
      console.debug('[Background] Clerk session token cleared');
    }
  });

  // Refresh token every 5 minutes to prevent expiration
  setInterval(() => {
    if (clerkClient?.session) {
      console.debug('[Background] Periodic token refresh...');
      refreshAndSaveToken();
    }
  }, 5 * 60 * 1000); // 5 minutes
}).catch((error) => {
  console.error('[Background] Failed to initialize Clerk client:', error);
});

// Initialize sync service on extension load
syncService.initialize().catch((error) => {
  console.error('Failed to initialize sync service:', error);
});

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.debug('WiserPin extension installed');
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.debug('WiserPin extension updated');
  }
});

// Message handler for communication between popup, content scripts, and background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.debug('Background received message:', message);

  // Handle different message types
  switch (message.type) {
    case 'PING':
      sendResponse({ type: 'PONG', timestamp: Date.now() });
      break;

    case 'GET_ACTIVE_TAB':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ tab: tabs[0] });
      });
      return true; // Keep channel open for async response

    case 'TRIGGER_SYNC':
      // Manual sync triggered from popup - refresh token first
      refreshAndSaveToken()
        .then(() => syncService.sync())
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'GET_SYNC_STATUS':
      syncService.getStatus()
        .then((status) => sendResponse({ status }))
        .catch((error) => sendResponse({ error: error.message }));
      return true;

    case 'ENABLE_SYNC':
      // Refresh token before enabling sync
      refreshAndSaveToken()
        .then(() => syncService.enable())
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    case 'DISABLE_SYNC':
      syncService.disable()
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));
      return true;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }

  return false;
});

// Tab update listener (for future metadata extraction)
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.debug('Tab loaded:', tab.url);
  }
});

// Keep service worker alive and initialize sync
chrome.runtime.onStartup.addListener(() => {
  console.debug('WiserPin service worker started');
  syncService.initialize().catch(console.error);
});
