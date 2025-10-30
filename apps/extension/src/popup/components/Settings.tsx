import { useState, useEffect } from 'react';
import { Label } from '@wiserpin/ui';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Load theme from storage
    chrome.storage.local.get(['theme'], (result) => {
      if (result.theme) {
        setTheme(result.theme);
        applyTheme(result.theme);
      }
    });
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    // Save to storage
    chrome.storage.local.set({ theme: newTheme });
  };

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
