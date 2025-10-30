/**
 * Options for summarization
 */
export interface SummarizerOptions {
  /** Page title */
  title?: string;

  /** Page URL */
  url?: string;

  /** Page content (for future use) */
  content?: string;

  /** Maximum length of summary */
  maxLength?: number;
}

/**
 * Result of summarization
 */
export interface SummarizerResult {
  /** Generated summary text */
  summary: string;

  /** Timestamp of generation */
  generatedAt: string;
}

/**
 * Summarizer interface
 */
export interface Summarizer {
  /**
   * Generate a summary from the given options
   */
  summarize(options: SummarizerOptions): Promise<SummarizerResult>;
}
