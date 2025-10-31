import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ChromeAISummarizer,
  createChromeAISummarizer,
} from '../summarizers/chrome-ai-summarizer';

// Mock Chrome AI API
const mockSession = {
  prompt: vi.fn(),
  promptStreaming: vi.fn(),
  clone: vi.fn(),
  destroy: vi.fn(),
  tokensSoFar: 0,
  maxTokens: 1000,
  tokensLeft: 1000,
};

const mockLanguageModel = {
  availability: vi.fn(),
  params: vi.fn(),
  create: vi.fn(),
};

// Setup global chrome mock
(globalThis as any).chrome = {
  ai: {
    languageModel: mockLanguageModel,
  },
};

describe('ChromeAISummarizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLanguageModel.availability.mockResolvedValue({ available: 'readily' });
    mockLanguageModel.params.mockResolvedValue({
      defaultTemperature: 0.7,
      maxTemperature: 1.0,
      defaultTopK: 40,
      maxTopK: 100,
    });
    mockLanguageModel.create.mockResolvedValue(mockSession);
    mockSession.prompt.mockResolvedValue('Test summary');
  });

  describe('checkAvailability', () => {
    it('should return readily when API is available', async () => {
      mockLanguageModel.availability.mockResolvedValue({ available: 'readily' });

      const availability = await ChromeAISummarizer.checkAvailability();

      expect(availability).toBe('readily');
    });

    it('should return after-download when model needs download', async () => {
      mockLanguageModel.availability.mockResolvedValue({
        available: 'after-download',
      });

      const availability = await ChromeAISummarizer.checkAvailability();

      expect(availability).toBe('after-download');
    });

    it('should return no when API is not available', async () => {
      mockLanguageModel.availability.mockResolvedValue({ available: 'no' });

      const availability = await ChromeAISummarizer.checkAvailability();

      expect(availability).toBe('no');
    });

    it('should return not-supported when chrome.ai is undefined', async () => {
      const originalChrome = (globalThis as any).chrome;
      (globalThis as any).chrome = undefined;

      const availability = await ChromeAISummarizer.checkAvailability();

      expect(availability).toBe('not-supported');
      (globalThis as any).chrome = originalChrome;
    });
  });

  describe('getModelParams', () => {
    it('should return model parameters', async () => {
      const params = await ChromeAISummarizer.getModelParams();

      expect(params).toEqual({
        defaultTemperature: 0.7,
        maxTemperature: 1.0,
        defaultTopK: 40,
        maxTopK: 100,
      });
    });

    it('should return null when API is not available', async () => {
      const originalChrome = (globalThis as any).chrome;
      (globalThis as any).chrome = undefined;

      const params = await ChromeAISummarizer.getModelParams();

      expect(params).toBeNull();
      (globalThis as any).chrome = originalChrome;
    });
  });

  describe('createChromeAISummarizer', () => {
    it('should create a summarizer instance', () => {
      const summarizer = createChromeAISummarizer();

      expect(summarizer).toBeInstanceOf(ChromeAISummarizer);
    });

    it('should create a summarizer with options', () => {
      const summarizer = createChromeAISummarizer({
        temperature: 0.8,
        topK: 50,
      });

      expect(summarizer).toBeInstanceOf(ChromeAISummarizer);
    });
  });

  describe('initialize', () => {
    it('should initialize successfully when readily available', async () => {
      const summarizer = createChromeAISummarizer();

      await summarizer.initialize();

      expect(mockLanguageModel.create).toHaveBeenCalled();
    });

    it('should pass custom options to session creation', async () => {
      const summarizer = createChromeAISummarizer({
        temperature: 0.8,
        topK: 50,
        systemPrompt: 'Test prompt',
      });

      await summarizer.initialize();

      expect(mockLanguageModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.8,
          topK: 50,
          systemPrompt: 'Test prompt',
        })
      );
    });

    it('should throw error when not supported', async () => {
      mockLanguageModel.availability.mockResolvedValue({ available: 'no' });
      const summarizer = createChromeAISummarizer();

      await expect(summarizer.initialize()).rejects.toThrow(
        'Chrome AI is not available'
      );
    });
  });

  describe('summarize', () => {
    it('should generate a summary', async () => {
      const summarizer = createChromeAISummarizer();
      mockSession.prompt.mockResolvedValue('This is a test summary');

      const result = await summarizer.summarize({
        title: 'Test Page',
        url: 'https://example.com',
      });

      expect(result.summary).toBe('This is a test summary');
      expect(result.generatedAt).toBeDefined();
      expect(mockSession.prompt).toHaveBeenCalled();
    });

    it('should include title and url in prompt', async () => {
      const summarizer = createChromeAISummarizer();
      mockSession.prompt.mockResolvedValue('Summary');

      await summarizer.summarize({
        title: 'Test Page',
        url: 'https://example.com',
      });

      const promptArg = mockSession.prompt.mock.calls[0][0];
      expect(promptArg).toContain('Test Page');
      expect(promptArg).toContain('https://example.com');
    });

    it('should respect maxLength option', async () => {
      const summarizer = createChromeAISummarizer();
      mockSession.prompt.mockResolvedValue('Summary');

      await summarizer.summarize({
        title: 'Test',
        maxLength: 100,
      });

      const promptArg = mockSession.prompt.mock.calls[0][0];
      expect(promptArg).toContain('100 characters');
    });

    it('should auto-initialize if not initialized', async () => {
      const summarizer = createChromeAISummarizer();

      await summarizer.summarize({ title: 'Test' });

      expect(mockLanguageModel.create).toHaveBeenCalled();
      expect(mockSession.prompt).toHaveBeenCalled();
    });
  });

  describe('summarizeStreaming', () => {
    it('should generate streaming summary', async () => {
      const summarizer = createChromeAISummarizer();
      await summarizer.initialize();

      const chunks = ['This ', 'is ', 'a ', 'test'];
      let currentIndex = 0;

      const mockStream = {
        getReader: () => ({
          read: async () => {
            if (currentIndex < chunks.length) {
              return { done: false, value: chunks[currentIndex++] };
            }
            return { done: true, value: undefined };
          },
        }),
      };

      mockSession.promptStreaming.mockReturnValue(mockStream as any);

      const result: string[] = [];
      for await (const chunk of summarizer.summarizeStreaming({ title: 'Test' })) {
        result.push(chunk);
      }

      expect(result).toEqual(chunks);
      expect(mockSession.promptStreaming).toHaveBeenCalled();
    });
  });

  describe('getTokenUsage', () => {
    it('should return token usage from session', async () => {
      const summarizer = createChromeAISummarizer();
      await summarizer.initialize();

      mockSession.tokensSoFar = 100;
      mockSession.maxTokens = 1000;
      mockSession.tokensLeft = 900;

      const usage = summarizer.getTokenUsage();

      expect(usage).toEqual({
        used: 100,
        max: 1000,
        remaining: 900,
      });
    });

    it('should return null when not initialized', () => {
      const summarizer = createChromeAISummarizer();

      const usage = summarizer.getTokenUsage();

      expect(usage).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should clean up session resources', async () => {
      const summarizer = createChromeAISummarizer();
      await summarizer.initialize();

      summarizer.destroy();

      expect(mockSession.destroy).toHaveBeenCalled();
    });

    it('should handle destroy when not initialized', () => {
      const summarizer = createChromeAISummarizer();

      expect(() => summarizer.destroy()).not.toThrow();
    });
  });
});
