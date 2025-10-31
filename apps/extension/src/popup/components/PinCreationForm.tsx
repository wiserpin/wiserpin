import { useState, useEffect } from 'react';
import type { Collection, CreatePinInput } from '@wiserpin/core';
import { addPin } from '@wiserpin/storage';
import { getDefaultSummarizer } from '@wiserpin/prompts';
import {
  Button,
  Label,
} from '@wiserpin/ui';

interface PinCreationFormProps {
  collections: Collection[];
  onCollectionCreated: () => Promise<void>;
  onSelectCollection?: () => void;
  onCollectionSelected?: (collectionId: string, collectionName: string) => void;
  onViewCollections?: () => void;
  selectedCollectionId?: string;
  selectedCollectionName?: string;
  aiAvailability: string | null;
  summary: string;
  setSummary: (summary: string) => void;
  generatingSummary: boolean;
  setGeneratingSummary: (generating: boolean) => void;
  aiError: string | null;
  setAiError: (error: string | null) => void;
}

export function PinCreationForm({
  collections,
  onSelectCollection,
  onCollectionSelected,
  onViewCollections,
  selectedCollectionId = '',
  selectedCollectionName = '',
  aiAvailability,
  summary,
  setSummary,
  generatingSummary,
  setGeneratingSummary,
  aiError,
  setAiError,
}: PinCreationFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestingCollection, setSuggestingCollection] = useState(false);

  // Load current tab info on mount
  useEffect(() => {
    loadCurrentTab();
  }, []);

  const loadCurrentTab = async () => {
    setLoadingMetadata(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url && tab?.title) {
        setUrl(tab.url);
        setTitle(tab.title);

        // Try to extract metadata
        if (tab.id) {
          try {
            const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_METADATA' });
            if (response?.metadata) {
              setUrl(response.metadata.url || tab.url);
              setTitle(response.metadata.title || tab.title);
              setOgImage(response.metadata.image || '');
              setSiteName(response.metadata.siteName || '');
            }
          } catch (error) {
            console.error('Failed to extract metadata:', error);
          }
        }

        // Don't auto-generate - requires user activation (button click)
        // User will click "Generate Summary" button
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
    } finally {
      setLoadingMetadata(false);
    }
  };

  const generateSummary = async (pageUrl: string, pageTitle: string) => {
    setGeneratingSummary(true);
    setAiError(null);
    try {
      console.debug('[WiserPin Popup] Requesting summary from content script...');

      // Show initial status
      if (aiAvailability === 'downloadable' || aiAvailability === 'after-download') {
        setSummary('Downloading AI model... 0%');
      } else {
        setSummary('Generating summary...');
      }

      // Listen for download progress messages
      const progressListener = (message: any) => {
        if (message.type === 'DOWNLOAD_PROGRESS') {
          console.debug(`[WiserPin Popup] Download progress: ${message.progress}%`);
          setSummary(`Downloading AI model... ${message.progress}%`);
        }
      };
      chrome.runtime.onMessage.addListener(progressListener);

      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Check if URL is accessible (content scripts can't run on chrome:// pages)
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
        throw new Error('Cannot generate summaries on browser internal pages. Please navigate to a regular webpage.');
      }

      // Send message to content script to generate summary
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GENERATE_SUMMARY',
        title: pageTitle,
        url: pageUrl,
      });

      // Remove progress listener
      chrome.runtime.onMessage.removeListener(progressListener);

      if (response.success) {
        console.debug('[WiserPin Popup] ✅ Summary received:', response.summary);
        setSummary(response.summary);
      } else {
        throw new Error(response.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('[WiserPin Popup] ❌ Error generating summary:', error);

      let errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';

      // Better error message for connection issues
      if (errorMessage.includes('Receiving end does not exist')) {
        errorMessage = 'Please reload this page and try again. The content script needs to initialize.';
      }

      setAiError(errorMessage);
      setSummary(''); // Clear summary on error
    } finally {
      setGeneratingSummary(false);
    }
  };

  const suggestCollection = async () => {
    if (collections.length === 0) {
      setError('No collections available. Create a collection first.');
      return;
    }

    setSuggestingCollection(true);
    setError(null);

    try {
      console.debug('[WiserPin Popup] Suggesting collection using Prompt API...');

      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Check if URL is accessible (content scripts can't run on chrome:// pages)
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
        throw new Error('Cannot suggest collections on browser internal pages. Please navigate to a regular webpage.');
      }

      // Send message to content script to suggest collection
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'SUGGEST_COLLECTION',
        title,
        url,
        summary,
        collections: collections.map(c => ({
          id: c.id,
          name: c.name
        }))
      });

      if (response.success && response.collectionId) {
        console.debug('[WiserPin Popup] ✅ Suggested collection:', response.collectionId);
        const suggested = collections.find(c => c.id === response.collectionId);
        if (suggested && onCollectionSelected) {
          // Auto-select the suggested collection
          onCollectionSelected(response.collectionId, suggested.name);
        }
      } else {
        throw new Error(response.error || 'Failed to suggest collection');
      }
    } catch (error) {
      console.error('[WiserPin Popup] ❌ Error suggesting collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to suggest collection';

      // More user-friendly error for connection issues
      if (errorMessage.includes('Receiving end does not exist')) {
        setError('Please reload this page to use AI suggestions');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSuggestingCollection(false);
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate
      if (!url) {
        setError('URL is required');
        return;
      }
      if (!selectedCollectionId) {
        setError('Please select a collection');
        return;
      }

      // Allow articles to be pinned multiple times (to different collections)
      // No duplicate check needed

      // Use pre-generated summary or try to generate a new one
      let summaryText = summary;
      if (!summaryText) {
        try {
          const summarizer = await getDefaultSummarizer();
          const summaryResult = await summarizer.summarize({
            title,
            url,
          });
          summaryText = summaryResult.summary;
        } catch (aiError) {
          console.warn('[WiserPin] Could not generate summary, saving without it');
          summaryText = `Saved from: ${title}`;
        }
      }

      // Create pin
      const pinInput: CreatePinInput = {
        collectionId: selectedCollectionId,
        page: {
          url,
          title: title || url,
        },
        summary: {
          text: summaryText,
          createdAt: new Date().toISOString(),
        },
      };

      await addPin(pinInput);
      setSuccess(true);

      // Don't auto-reset, let user dismiss or navigate
      // Reset form after user action
      // setTimeout(() => {
      //   setUrl('');
      //   setTitle('');
      //   setSuccess(false);
      //   loadCurrentTab();
      // }, 2000);
    } catch (err) {
      console.error('Failed to create pin:', err);
      setError(err instanceof Error ? err.message : 'Failed to create pin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreatePin(e);
  };

  if (loadingMetadata) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-sm text-gray-500">Loading page details...</p>
        </div>
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb',
            padding: '12px 16px',
            boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 50
          }}
        >
          <Button disabled className="w-full h-12 text-base font-medium">
            Loading...
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Scrollable Content */}
      <div style={{ paddingBottom: '200px' }}>
          {/* Page Preview Card */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm" style={{ marginBottom: '32px' }}>
            {ogImage && (
              <div className="bg-gray-50 dark:bg-gray-900" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px', maxHeight: '200px', padding: 0, margin: 0 }}>
                <img
                  src={ogImage}
                  alt={title}
                  style={{ width: '100%', height: 'auto', maxHeight: '200px', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-800" style={{ padding: '20px' }}>
              {siteName && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide" style={{ marginBottom: '8px' }}>
                  {siteName}
                </p>
              )}
              <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100" style={{ marginBottom: '6px', lineHeight: '1.5' }}>
                {title || 'Untitled Page'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {new URL(url).hostname}
              </p>
            </div>
          </div>

          {/* AI Summary Section */}
          <div style={{ marginBottom: '24px' }}>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">
                AI Summary
              </Label>
              {!summary && !generatingSummary && !aiError && (
                <Button
                  onClick={() => generateSummary(url, title)}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Summary
                </Button>
              )}
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
              {generatingSummary ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Generating summary with Chrome AI...</p>
                </div>
              ) : aiError ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Chrome AI Not Available</p>
                      <div className="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                        <p className="font-mono text-gray-700 dark:text-gray-300">
                          Availability: <span className="font-semibold">{aiAvailability || 'unknown'}</span>
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{aiError}</p>
                      <div className="bg-white dark:bg-gray-900 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">📋 Check the browser console (F12) for detailed logs</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 mt-3">To enable Chrome AI:</p>
                        <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                          <li>Open <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">chrome://flags/#optimization-guide-on-device-model</code></li>
                          <li>Set "Enabled BypassPerfRequirement"</li>
                          <li>Open <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">chrome://flags/#prompt-api-for-gemini-nano</code></li>
                          <li>Set "Enabled"</li>
                          <li>Restart Chrome completely</li>
                          <li>Check <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">chrome://components/</code> for "Optimization Guide On Device Model"</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>
              ) : summary ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      Generated by Chrome AI (Gemini Nano)
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Click "Generate Summary" to create an AI summary</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Powered by Chrome AI (Gemini Nano)</p>
                  {aiAvailability === 'after-download' && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-600 dark:text-blue-400">
                      📥 Chrome is downloading the AI model in the background. This may take a few minutes. Check <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">chrome://on-device-internals</code> for progress.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Failed to save</p>
                <p className="text-red-700 dark:text-red-400 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}
      </div>

      {/* Fixed Footer Buttons */}
      <div
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '12px 16px',
          boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 50
        }}
      >
        {success ? (
          /* Success State - Show pinned message and view collections button */
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <svg className="w-6 h-6 flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Page Pinned Successfully!</p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">Saved to {selectedCollectionName}</p>
              </div>
            </div>
            <Button
              onClick={onViewCollections}
              variant="outline"
              className="w-full h-11"
            >
              View All Collections
            </Button>
          </div>
        ) : (
          /* Normal State - Show collection selector and save button */
          <>
            {/* Collection Selector with AI Suggestion Button */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={onSelectCollection}
                className="flex-1 h-11 px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              >
                {selectedCollectionName ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: collections.find(c => c.id === selectedCollectionId)?.color || '#3b82f6'
                      }}
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{selectedCollectionName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Select Collection</span>
                )}
                <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* AI Suggestion Button */}
              <button
                onClick={suggestCollection}
                disabled={suggestingCollection || collections.length === 0}
                className="h-11 w-11 flex items-center justify-center border border-indigo-300 dark:border-indigo-600 rounded-md bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900 dark:hover:to-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="AI Suggest Collection"
              >
                {suggestingCollection ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                ) : (
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedCollectionId}
              className="w-full h-12 text-base font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </span>
              ) : (
                'Save to Collection'
              )}
            </Button>
          </>
        )}
      </div>
    </>
  );
}
