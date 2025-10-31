import { describe, it, expect } from 'vitest';
import { createSummarizer, getDefaultSummarizer } from '../factory';
import { MockSummarizer } from '../summarizers/mock-summarizer';

describe('createSummarizer', () => {
  it('should create mock summarizer by default', () => {
    const summarizer = createSummarizer();
    expect(summarizer).toBeInstanceOf(MockSummarizer);
  });

  it('should create mock summarizer when specified', () => {
    const summarizer = createSummarizer('mock');
    expect(summarizer).toBeInstanceOf(MockSummarizer);
  });

  it('should throw error for api summarizer (not implemented)', () => {
    expect(() => createSummarizer('api')).toThrow(
      'API summarizer not yet implemented. Use mock for MVP.'
    );
  });
});

describe('getDefaultSummarizer', () => {
  it('should return mock summarizer', async () => {
    const summarizer = await getDefaultSummarizer();
    expect(summarizer).toBeInstanceOf(MockSummarizer);
  });

  it('should return functional summarizer', async () => {
    const summarizer = await getDefaultSummarizer();
    const result = await summarizer.summarize({ title: 'Test' });

    expect(result.summary).toBeTruthy();
    expect(result.generatedAt).toBeTruthy();
  });
});
