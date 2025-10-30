import { useState, useEffect } from 'react';
import type { Collection, CreatePinInput } from '@wiserpin/core';
import { addPin, checkPinExists } from '@wiserpin/storage';
import { getDefaultSummarizer } from '@wiserpin/prompts';
import {
  Button,
  Label,
} from '@wiserpin/ui';

interface PinCreationFormProps {
  collections: Collection[];
  onCollectionCreated: () => Promise<void>;
  onSelectCollection?: () => void;
  selectedCollectionId?: string;
  selectedCollectionName?: string;
}

export function PinCreationForm({
  collections,
  onSelectCollection,
  selectedCollectionId = '',
  selectedCollectionName = '',
}: PinCreationFormProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
    } finally {
      setLoadingMetadata(false);
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

      // Check if pin already exists
      const exists = await checkPinExists(url);
      if (exists) {
        setError('This URL is already pinned');
        return;
      }

      // Generate summary
      const summarizer = getDefaultSummarizer();
      const summaryResult = await summarizer.summarize({
        title,
        url,
      });

      // Create pin
      const pinInput: CreatePinInput = {
        collectionId: selectedCollectionId,
        page: {
          url,
          title: title || url,
        },
        summary: {
          text: summaryResult.summary,
          createdAt: summaryResult.generatedAt,
        },
      };

      await addPin(pinInput);
      setSuccess(true);

      // Reset form
      setTimeout(() => {
        setUrl('');
        setTitle('');
        setSuccess(false);
        loadCurrentTab();
      }, 2000);
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
      <div style={{ paddingBottom: '88px' }}>
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

          <div style={{ marginBottom: '24px' }}>
            <Label htmlFor="collection" className="text-sm font-medium" style={{ display: 'block', marginBottom: '12px' }}>
              Save to Collection
            </Label>
            <button
              onClick={onSelectCollection}
              className="w-full h-11 px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
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
                <span className="text-sm text-gray-500 dark:text-gray-400">Choose a collection...</span>
              )}
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-lg text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Saved successfully!</p>
                <p className="text-green-700 dark:text-green-400 text-xs mt-1">Your pin has been added to the collection.</p>
              </div>
            </div>
          )}

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

      {/* Fixed Footer Button */}
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
      </div>
    </>
  );
}
