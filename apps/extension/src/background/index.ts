/**
 * Background Service Worker
 * Handles extension lifecycle, context menu, and message passing
 */

console.log('WiserPin background service worker loaded');

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('WiserPin extension installed');
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('WiserPin extension updated');
  }
});

// Message handler for communication between popup, content scripts, and background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Background received message:', message);

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

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }

  return false;
});

// Tab update listener (for future metadata extraction)
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab loaded:', tab.url);
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('WiserPin service worker started');
});
