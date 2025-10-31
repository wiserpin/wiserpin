/**
 * User settings for the extension
 */
export interface Settings {
  /** Whether to automatically generate summaries when opening popup */
  autoGenerateSummary: boolean;

  /** Whether to automatically suggest collection when opening popup */
  autoSuggestCollection: boolean;

  /** Theme preference (for future) */
  theme?: 'light' | 'dark' | 'system';

  /** Default collection ID (for future) */
  defaultCollectionId?: string;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: Settings = {
  autoGenerateSummary: false,
  autoSuggestCollection: false,
  theme: 'system',
};
