/**
 * @wiserpin/prompts
 *
 * Summarization and prompt logic for WiserPin
 * Currently uses mock summarizer for MVP
 */

// Export types
export type {
  Summarizer,
  SummarizerOptions,
  SummarizerResult,
} from './types';

// Export summarizers
export { MockSummarizer, createMockSummarizer } from './summarizers/mock-summarizer';

// Export factory
export {
  createSummarizer,
  getDefaultSummarizer,
  type SummarizerType,
} from './factory';
