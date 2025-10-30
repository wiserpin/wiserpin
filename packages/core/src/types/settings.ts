/**
 * User settings for the extension
 */
export interface Settings {
  /** Whether to automatically generate summaries when pinning pages */
  autoSummarize: boolean;

  /** Theme preference (for future) */
  theme?: 'light' | 'dark' | 'system';

  /** Default collection ID (for future) */
  defaultCollectionId?: string;
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: Settings = {
  autoSummarize: true,
  theme: 'system',
};
