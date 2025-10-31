/**
 * Content Script
 * Injected into web pages for metadata extraction and page interaction
 */

console.debug('WiserPin content script loaded');

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
  console.debug('Content script received message:', message);

  switch (message.type) {
    case 'EXTRACT_METADATA':
      const metadata = extractPageMetadata();
      sendResponse({ metadata });
      break;

    case 'GENERATE_SUMMARY':
      // Run in async context since we need to await
      (async () => {
        try {
          console.debug('[WiserPin Content] Generating summary with Summarizer API...');
          console.debug('[WiserPin Content] Input:', message.title, message.url);

          // Check if Summarizer API is available
          if (typeof (window as any).Summarizer === 'undefined') {
            throw new Error('Summarizer API not available. Please enable chrome://flags/#summarization-api-for-gemini-nano');
          }

          // Create session with monitor callback for download progress
          const session = await (window as any).Summarizer.create({
            type: 'tldr',
            format: 'plain-text',
            length: 'medium',
            monitor(m: any) {
              console.debug('[WiserPin Content] Download monitor attached');
              m.addEventListener('downloadprogress', (e: any) => {
                const progress = e.loaded || 0;
                const percent = Math.round(progress * 100);
                console.debug(`[WiserPin Content] Download progress: ${percent}%`);

                // Send progress update to popup
                chrome.runtime.sendMessage({
                  type: 'DOWNLOAD_PROGRESS',
                  progress: percent
                }).catch(() => {
                  // Ignore if popup is closed
                });
              });
            },
          });

          console.debug('[WiserPin Content] Session created, generating summary...');

          // Generate summary
          const prompt = `Please provide a concise summary (maximum 200 characters) for the following web page:\n\nTitle: ${message.title}\nURL: ${message.url}\n\nProvide only the summary text without any preamble or additional commentary.`;
          const summary = await session.summarize(prompt);

          console.debug('[WiserPin Content] ✅ Summary generated:', summary);

          // Clean up
          if (session?.destroy) {
            session.destroy();
          }

          sendResponse({ success: true, summary });
        } catch (error) {
          console.error('[WiserPin Content] ❌ Error generating summary:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate summary'
          });
        }
      })();
      return true; // Keep message channel open for async response

    case 'SUGGEST_COLLECTION':
      // Run in async context since we need to await
      (async () => {
        try {
          console.debug('[WiserPin Content] Suggesting collection with Summarizer API...');
          console.debug('[WiserPin Content] Input:', message.title, message.collections);

          // Check if Summarizer API is available (same as summary generation)
          if (typeof (window as any).Summarizer === 'undefined') {
            throw new Error('Summarizer API not available. Please enable chrome://flags/#summarization-api-for-gemini-nano');
          }

          // Create session
          const session = await (window as any).Summarizer.create({
            type: 'tldr',
            format: 'plain-text',
            length: 'short',
          });

          console.debug('[WiserPin Content] Session created, suggesting collection...');

          // Build prompt
          const collectionsText = message.collections.map((c: any) =>
            `- ${c.name} (ID: ${c.id})${c.goal ? ` - Goal: ${c.goal}` : ''}`
          ).join('\n');

          const prompt = `Analyze this web page and choose which collection it belongs to based on the collection goals.

Page: ${message.title}
URL: ${message.url}
${message.summary ? `Summary: ${message.summary}` : ''}

Available Collections:
${collectionsText}

Which collection ID best matches this page based on its goal? Respond with ONLY the ID.`;

          const response = await session.summarize(prompt);

          console.debug('[WiserPin Content] ✅ AI Response:', response);

          // Extract collection ID from response (remove any whitespace/newlines)
          const responseText = response.trim();

          // Try to find exact ID match first
          let collectionId = null;

          // Check if response contains any of the collection IDs
          for (const c of message.collections) {
            if (responseText.includes(c.id)) {
              collectionId = c.id;
              break;
            }
          }

          // If no exact ID match, try matching by name
          if (!collectionId) {
            for (const c of message.collections) {
              if (responseText.toLowerCase().includes(c.name.toLowerCase())) {
                collectionId = c.id;
                break;
              }
            }
          }

          // Clean up
          if (session?.destroy) {
            session.destroy();
          }

          if (collectionId) {
            sendResponse({ success: true, collectionId });
          } else {
            // Default to first collection if AI can't decide
            console.debug('[WiserPin Content] Could not parse AI response, using first collection');
            sendResponse({ success: true, collectionId: message.collections[0].id });
          }
        } catch (error) {
          console.error('[WiserPin Content] ❌ Error suggesting collection:', error);
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to suggest collection'
          });
        }
      })();
      return true; // Keep message channel open for async response

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
