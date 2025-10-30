/**
 * Content Script
 * Injected into web pages for metadata extraction and page interaction
 */

console.log('WiserPin content script loaded');

/**
 * Extract page metadata for pin creation
 */
export function extractPageMetadata() {
  const metadata = {
    url: window.location.href,
    title: document.title,
    description: '',
    image: '',
    author: '',
    publishedTime: '',
  };

  // Extract Open Graph metadata
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogImage = document.querySelector('meta[property="og:image"]');

  // Extract Twitter Card metadata
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  const twitterImage = document.querySelector('meta[name="twitter:image"]');

  // Extract standard metadata
  const metaDescription = document.querySelector('meta[name="description"]');
  const metaAuthor = document.querySelector('meta[name="author"]');

  // Prioritize OG tags, fallback to Twitter, then standard
  metadata.title =
    ogTitle?.getAttribute('content') ||
    twitterTitle?.getAttribute('content') ||
    document.title;

  metadata.description =
    ogDescription?.getAttribute('content') ||
    twitterDescription?.getAttribute('content') ||
    metaDescription?.getAttribute('content') ||
    '';

  metadata.image =
    ogImage?.getAttribute('content') ||
    twitterImage?.getAttribute('content') ||
    '';

  metadata.author = metaAuthor?.getAttribute('content') || '';

  // Extract published time
  const timeElement = document.querySelector('time[datetime]');
  metadata.publishedTime = timeElement?.getAttribute('datetime') || '';

  return metadata;
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Content script received message:', message);

  switch (message.type) {
    case 'EXTRACT_METADATA':
      const metadata = extractPageMetadata();
      sendResponse({ metadata });
      break;

    case 'PING':
      sendResponse({ type: 'PONG', from: 'content' });
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }

  return false;
});

// Notify background that content script is ready
chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' }).catch(() => {
  // Ignore errors if background script is not ready
});
