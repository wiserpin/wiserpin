import type { Summarizer } from './types';
import { createMockSummarizer } from './summarizers/mock-summarizer';
import {
  createChromeAISummarizer,
  type ChromeAISummarizerOptions,
  ChromeAISummarizer,
} from './summarizers/chrome-ai-summarizer';

/**
 * Summarizer type
 */
export type SummarizerType = 'mock' | 'chrome-ai' | 'api';

/**
 * Options for creating summarizers
 */
export interface CreateSummarizerOptions {
  /** Options for Chrome AI summarizer */
  chromeAI?: ChromeAISummarizerOptions;
}

/**
 * Factory to create summarizer instances
 * Makes it easy to swap mock for real implementation later
 */
export function createSummarizer(
  type: SummarizerType = 'mock',
  options?: CreateSummarizerOptions
): Summarizer {
  switch (type) {
    case 'mock':
      return createMockSummarizer();
    case 'chrome-ai':
      return createChromeAISummarizer(options?.chromeAI);
    case 'api':
      // TODO: Implement real API summarizer in future
      throw new Error('API summarizer not yet implemented. Use mock for MVP.');
    default:
      throw new Error(`Unknown summarizer type: ${type}`);
  }
}

/**
 * Get the default summarizer - Chrome AI only
 * Throws error if Chrome AI is not available
 */
export async function getDefaultSummarizer(
  options?: CreateSummarizerOptions
): Promise<Summarizer> {
  // Check if Chrome AI is available
  const availability = await ChromeAISummarizer.checkAvailability();

  if (availability === 'readily' || availability === 'after-download') {
    return createSummarizer('chrome-ai', options);
  }

  // Throw error if not available
  throw new Error(
    'Chrome AI is not available. Please enable the Prompt API in chrome://flags/#optimization-guide-on-device-model and restart Chrome.'
  );
}
