import type { Summarizer } from './types';
import { createMockSummarizer } from './summarizers/mock-summarizer';

/**
 * Summarizer type
 */
export type SummarizerType = 'mock' | 'api';

/**
 * Factory to create summarizer instances
 * Makes it easy to swap mock for real implementation later
 */
export function createSummarizer(type: SummarizerType = 'mock'): Summarizer {
  switch (type) {
    case 'mock':
      return createMockSummarizer();
    case 'api':
      // TODO: Implement real API summarizer in future
      throw new Error('API summarizer not yet implemented. Use mock for MVP.');
    default:
      throw new Error(`Unknown summarizer type: ${type}`);
  }
}

/**
 * Get the default summarizer (mock for MVP)
 */
export function getDefaultSummarizer(): Summarizer {
  return createSummarizer('mock');
}
