import type { Summarizer, SummarizerOptions, SummarizerResult } from '../types';

/**
 * Mock summarizer for MVP
 * Generates deterministic mock summaries based on input
 */
export class MockSummarizer implements Summarizer {
  async summarize(options: SummarizerOptions): Promise<SummarizerResult> {
    const { title, url, content } = options;

    // Generate deterministic summary based on input
    const summary = this.generateMockSummary(title, url, content);

    return {
      summary,
      generatedAt: new Date().toISOString(),
    };
  }

  private generateMockSummary(
    title?: string,
    url?: string,
    content?: string
  ): string {
    // Generate different mock summaries based on input
    const source: string = title || url || 'this page';

    const templates = [
      `This is a mock summary for ${source}. The content provides valuable information about the topic discussed.`,
      `Summary of ${source}: This page covers important concepts and details that are worth reviewing later.`,
      `${source} contains useful information that has been captured for future reference.`,
    ];

    // Use a simple hash of the input to deterministically select a template
    const hash = this.simpleHash(source);
    const templateIndex = hash % templates.length;
    const template: string = templates[templateIndex]!;

    // Add content hint if available
    if (content && content.length > 0) {
      return `${template} Additional context from page content included.`;
    }

    return template;
  }

  /**
   * Simple hash function for deterministic template selection
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Create a new mock summarizer instance
 */
export function createMockSummarizer(): Summarizer {
  return new MockSummarizer();
}
