/**
 * @wiserpin/prompts
 *
 * Summarization and prompt logic for WiserPin
 * Supports mock, Chrome AI (Gemini Nano), and API summarizers
 */

// Export types
export type {
  Summarizer,
  SummarizerOptions,
  SummarizerResult,
} from './types';

// Export summarizers
export { MockSummarizer, createMockSummarizer } from './summarizers/mock-summarizer';
export {
  ChromeAISummarizer,
  createChromeAISummarizer,
  type ChromeAIAvailability,
  type ChromeAISummarizerOptions,
  type DownloadProgressCallback,
} from './summarizers/chrome-ai-summarizer';

// Export factory
export {
  createSummarizer,
  getDefaultSummarizer,
  type SummarizerType,
  type CreateSummarizerOptions,
} from './factory';
