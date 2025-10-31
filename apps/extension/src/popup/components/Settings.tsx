import { useState, useEffect } from 'react';
import { Label, Button, Switch } from '@wiserpin/ui';
import { getSettings, updateSettings, clearAllData } from '@wiserpin/storage';
import type { Settings as SettingsType } from '@wiserpin/core';
import { ChromeAISummarizer, type ChromeAIAvailability } from '@wiserpin/prompts';
import { useUser, SignedIn, SignedOut, UserButton } from '@clerk/chrome-extension';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { isSignedIn, user } = useUser();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiAvailability, setAiAvailability] = useState<ChromeAIAvailability | null>(null);
  const [downloadingModel, setDownloadingModel] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Cloud Sync state
  const [syncEnabled, setSyncEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
    checkAIAvailability();
    loadSyncSettings();
  }, []);

  const loadSyncSettings = async () => {
    const result = await chrome.storage.local.get(['wiserpin_sync_settings']);
    if (result.wiserpin_sync_settings) {
      setSyncEnabled(result.wiserpin_sync_settings.enabled);
    }
  };

  const handleToggleSync = async () => {
    if (!isSignedIn) {
      alert('Please sign in first to enable cloud sync.');
      return;
    }

    const newValue = !syncEnabled;
    setSyncEnabled(newValue);

    // Send message to background to enable/disable sync
    chrome.runtime.sendMessage({
      type: newValue ? 'ENABLE_SYNC' : 'DISABLE_SYNC'
    });
  };

  const handleOpenWebDashboard = () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  };

  const loadSettings = async () => {
    try {
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);

      // Load theme from settings
      if (loadedSettings.theme) {
        const themeValue = loadedSettings.theme === 'system' ? 'light' : loadedSettings.theme;
        setTheme(themeValue);
        applyTheme(themeValue);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAIAvailability = async () => {
    const availability = await ChromeAISummarizer.checkAvailability();
    setAiAvailability(availability);
    console.debug('[Settings] AI availability:', availability);
  };

  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    await updateSettings({ theme: newTheme });
  };

  const handleToggleAutoSummary = async () => {
    if (!settings) return;
    const newValue = !settings.autoGenerateSummary;
    await updateSettings({ autoGenerateSummary: newValue });
    setSettings({ ...settings, autoGenerateSummary: newValue });
  };

  const handleToggleAutoSuggest = async () => {
    if (!settings) return;
    const newValue = !settings.autoSuggestCollection;
    await updateSettings({ autoSuggestCollection: newValue });
    setSettings({ ...settings, autoSuggestCollection: newValue });
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all local data?\n\n' +
      'This will delete:\n' +
      '• All saved pins\n' +
      '• All collections\n\n' +
      'Settings and cloud data will not be affected.\n\n' +
      'This action cannot be undone!'
    );

    if (confirmed) {
      try {
        await clearAllData();
        alert('All local data has been cleared successfully!');
        // Reload the popup to reflect the changes
        window.location.reload();
      } catch (error) {
        console.error('Failed to clear data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  };

  const handleDownloadModel = async () => {
    setDownloadingModel(true);
    setDownloadProgress(0);

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Check if URL is accessible
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
        throw new Error('Please navigate to a regular webpage to download the AI model.');
      }

      // Send message to content script to trigger model download
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GENERATE_SUMMARY',
        title: 'Test',
        url: tab.url || 'https://example.com'
      });

      if (response.success) {
        // Model downloaded successfully, start polling
        pollForModelReady();
      } else {
        throw new Error(response.error || 'Failed to download model');
      }
    } catch (error) {
      console.error('[Settings] Error downloading model:', error);
      setDownloadingModel(false);
      alert(error instanceof Error ? error.message : 'Failed to download model');
    }
  };

  const pollForModelReady = async () => {
    const checkInterval = setInterval(async () => {
      const availability = await ChromeAISummarizer.checkAvailability();
      setAiAvailability(availability);

      if (availability === 'readily') {
        clearInterval(checkInterval);
        setDownloadingModel(false);
        setDownloadProgress(100);
      } else {
        // Simulate progress
        setDownloadProgress(prev => Math.min(prev + 10, 90));
      }
    }, 2000);

    // Timeout after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      setDownloadingModel(false);
    }, 300000);
  };

  const isModelReady = aiAvailability === 'readily';
  const canEnableAI = isModelReady;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700" style={{ padding: '16px 16px 12px 16px' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h2>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px' }}>
        <div className="space-y-6">
          {/* Cloud Sync Section */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Cloud Sync</Label>

            {/* Sign In Status */}
            <div className="mb-4 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">Account Status</p>
                  <SignedOut>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Not signed in</p>
                  </SignedOut>
                  <SignedIn>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Signed in as {user?.primaryEmailAddress?.emailAddress || 'user'}
                    </p>
                  </SignedIn>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isSignedIn
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                  {isSignedIn ? 'Signed In' : 'Signed Out'}
                </span>
              </div>

              <SignedOut>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Sign in to sync your pins across devices. OAuth providers like Google require signing in through the web dashboard.
                </p>
                <Button
                  onClick={handleOpenWebDashboard}
                  className="w-full"
                >
                  Sign In via Web Dashboard
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  After signing in, your session will sync to the extension
                </p>
              </SignedOut>

              <SignedIn>
                <div className="space-y-2">
                  <Button
                    onClick={handleOpenWebDashboard}
                    variant="outline"
                    className="w-full"
                  >
                    Open Web Dashboard
                  </Button>
                  <div className="flex justify-center pt-2">
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10"
                        }
                      }}
                    />
                  </div>
                </div>
              </SignedIn>
            </div>

            {/* Sync Toggle */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                  </svg>
                  <Label htmlFor="cloud-sync" className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                    Enable Cloud Sync
                  </Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-7">
                  Automatically sync pins with the cloud
                  {!isSignedIn && ' (requires sign in)'}
                </p>
              </div>
              <Switch
                id="cloud-sync"
                checked={syncEnabled}
                onCheckedChange={handleToggleSync}
                disabled={!isSignedIn}
                className="flex-shrink-0"
              />
            </div>

            {syncEnabled && isSignedIn && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  ✓ Cloud sync is active. Your pins will automatically sync every 5 minutes. Check the sync status in the header above.
                </p>
              </div>
            )}
          </div>

          {/* AI Features Section */}
          <div>
            <Label className="text-base font-semibold mb-3 block">AI Features</Label>

            {/* Model Status */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Model Status</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isModelReady
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {isModelReady ? 'Ready' : aiAvailability === 'after-download' ? 'Not Downloaded' : 'Not Available'}
                </span>
              </div>

              {!isModelReady && aiAvailability === 'after-download' && (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                    Download the AI model to enable automatic summary generation and collection suggestions.
                  </p>
                  {downloadingModel ? (
                    <div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Downloading model... {downloadProgress}%</p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleDownloadModel}
                      size="sm"
                      className="w-full"
                    >
                      Download AI Model
                    </Button>
                  )}
                </>
              )}

              {!isModelReady && aiAvailability === 'no' && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  AI features are not available in your browser. Please use Chrome 128+ with the Summarization API enabled.
                </p>
              )}
            </div>

            {/* Warning if model not ready */}
            {!canEnableAI && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  AI features can only be enabled when the model is ready. Please download the model first.
                </p>
              </div>
            )}

            {/* Auto Generate Summary */}
            <div className="mb-3 flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <Label htmlFor="auto-summary" className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                    Auto Generate Summary
                  </Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-7">Automatically generate page summary when popup opens</p>
              </div>
              <Switch
                id="auto-summary"
                checked={settings?.autoGenerateSummary || false}
                onCheckedChange={handleToggleAutoSummary}
                disabled={!canEnableAI}
                className="flex-shrink-0"
              />
            </div>

            {/* Auto Suggest Collection */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                    </svg>
                  </div>
                  <Label htmlFor="auto-suggest" className="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                    Auto Suggest Collection
                  </Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 pl-7">Automatically suggest best collection when popup opens</p>
              </div>
              <Switch
                id="auto-suggest"
                checked={settings?.autoSuggestCollection || false}
                onCheckedChange={handleToggleAutoSuggest}
                disabled={!canEnableAI}
                className="flex-shrink-0"
              />
            </div>
          </div>

          {/* Theme Setting */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Appearance</Label>
            <div className="space-y-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                  theme === 'light'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Light Mode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Default bright theme</p>
                  </div>
                </div>
                {theme === 'light' && (
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                  theme === 'dark'
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-800 dark:bg-gray-900 border-2 border-gray-600 dark:border-gray-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Dark Mode</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Easy on the eyes</p>
                  </div>
                </div>
                {theme === 'dark' && (
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Data Management Section */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Data Management</Label>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Clear Local Data</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remove all locally stored pins and collections. Your settings and cloud data will not be affected.
                </p>
              </div>
              <Button
                onClick={handleClearData}
                variant="outline"
                className="w-full border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear All Local Data
              </Button>
            </div>
          </div>

          {/* About Section */}
          <div>
            <Label className="text-base font-semibold mb-3 block">About</Label>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <span className="font-semibold">WiserPin</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Version 0.1.0
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Save and organize your favorite pages with AI-powered summaries
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
