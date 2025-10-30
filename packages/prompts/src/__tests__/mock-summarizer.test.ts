import { describe, it, expect } from 'vitest';
import { MockSummarizer, createMockSummarizer } from '../summarizers/mock-summarizer';
import type { SummarizerOptions } from '../types';

describe('MockSummarizer', () => {
  it('should return consistent summaries for same input', async () => {
    const summarizer = new MockSummarizer();
    const options: SummarizerOptions = {
      title: 'Test Article',
      url: 'https://example.com',
    };

    const result1 = await summarizer.summarize(options);
    const result2 = await summarizer.summarize(options);

    expect(result1.summary).toBe(result2.summary);
  });

  it('should generate summary with only title', async () => {
    const summarizer = new MockSummarizer();
    const options: SummarizerOptions = {
      title: 'Test Title',
    };

    const result = await summarizer.summarize(options);

    expect(result.summary).toContain('Test Title');
    expect(result.generatedAt).toBeTruthy();
  });

  it('should generate summary with only URL', async () => {
    const summarizer = new MockSummarizer();
    const options: SummarizerOptions = {
      url: 'https://example.com/article',
    };

    const result = await summarizer.summarize(options);

    expect(result.summary).toContain('https://example.com/article');
    expect(result.generatedAt).toBeTruthy();
  });

  it('should prioritize title over URL', async () => {
    const summarizer = new MockSummarizer();
    const options: SummarizerOptions = {
      title: 'Test Title',
      url: 'https://example.com',
    };

    const result = await summarizer.summarize(options);

    expect(result.summary).toContain('Test Title');
  });

  it('should add content hint when content is provided', async () => {
    const summarizer = new MockSummarizer();
    const options: SummarizerOptions = {
      title: 'Test Article',
      url: 'https://example.com',
      content: 'This is the page content with important information.',
    };

    const result = await summarizer.summarize(options);

    expect(result.summary).toContain('Additional context from page content included.');
  });

  it('should use default source when no title or URL provided', async () => {
    const summarizer = new MockSummarizer();
    const options: SummarizerOptions = {};

    const result = await summarizer.summarize(options);

    expect(result.summary).toContain('this page');
  });

  it('should generate different summaries for different inputs', async () => {
    const summarizer = new MockSummarizer();
    const options1: SummarizerOptions = { title: 'Article A' };
    const options2: SummarizerOptions = { title: 'Article B' };

    const result1 = await summarizer.summarize(options1);
    const result2 = await summarizer.summarize(options2);

    // Summaries should be different (different hash -> different template)
    expect(result1.summary).not.toBe(result2.summary);
  });

  it('should include valid ISO timestamp', async () => {
    const summarizer = new MockSummarizer();
    const options: SummarizerOptions = { title: 'Test' };

    const result = await summarizer.summarize(options);

    // Check that generatedAt is a valid ISO date string
    const date = new Date(result.generatedAt);
    expect(date.toISOString()).toBe(result.generatedAt);
  });
});

describe('createMockSummarizer', () => {
  it('should create a valid summarizer instance', async () => {
    const summarizer = createMockSummarizer();
    const options: SummarizerOptions = { title: 'Test' };

    const result = await summarizer.summarize(options);

    expect(result.summary).toBeTruthy();
    expect(result.generatedAt).toBeTruthy();
  });
});
