import type { Summarizer, SummarizerOptions, SummarizerResult } from '../types';

/**
 * Chrome AI Prompt API availability status
 * Note: Chrome may return 'available' (synonym for 'readily') or 'downloadable' (synonym for 'after-download')
 */
export type ChromeAIAvailability = 'readily' | 'after-download' | 'no' | 'not-supported' | 'available' | 'downloadable';

/**
 * Chrome AI download progress callback
 */
export type DownloadProgressCallback = (downloaded: number, total: number) => void;

/**
 * Options for Chrome AI Summarizer
 */
export interface ChromeAISummarizerOptions {
  /** Temperature parameter (0.0 - 1.0) */
  temperature?: number;

  /** TopK parameter for sampling */
  topK?: number;

  /** Custom system prompt */
  systemPrompt?: string;

  /** Callback for download progress updates */
  onDownloadProgress?: DownloadProgressCallback;

  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Summarizer using Chrome's built-in AI Prompt API
 * Uses Gemini Nano model that runs locally in the browser
 */
export class ChromeAISummarizer implements Summarizer {
  private session: chrome.ai.AILanguageModelSession | null = null;
  private options: ChromeAISummarizerOptions;

  constructor(options: ChromeAISummarizerOptions = {}) {
    this.options = options;
  }

  /**
   * Check if Chrome AI is available
   */
  static async checkAvailability(): Promise<ChromeAIAvailability> {
    console.debug('[ChromeAISummarizer] Checking availability...');
    console.debug('[ChromeAISummarizer] typeof globalThis.Summarizer:', typeof (globalThis as any).Summarizer);
    console.debug('[ChromeAISummarizer] typeof globalThis.LanguageModel:', typeof (globalThis as any).LanguageModel);
    console.debug('[ChromeAISummarizer] typeof globalThis.ai:', typeof (globalThis as any).ai);

    // Try window.Summarizer first (matches Google demo: https://github.com/GoogleChromeLabs/web-ai-demos/blob/main/summarization-api-playground/src/main.ts)
    if (typeof (globalThis as any).Summarizer !== 'undefined') {
      console.debug('[ChromeAISummarizer] ✅ Found window.Summarizer API (Google demo pattern)');
      try {
        const availability = await (globalThis as any).Summarizer.availability();
        console.debug('[ChromeAISummarizer] Summarizer availability:', availability);

        // Map the response to our format (demo uses 'available' and 'downloadable')
        if (availability === 'available' || availability === 'readily') {
          return 'readily';
        } else if (availability === 'downloadable' || availability === 'after-download') {
          return 'after-download';
        } else {
          return 'no';
        }
      } catch (error) {
        console.error('[ChromeAISummarizer] Error checking Summarizer:', error);
      }
    }

    // Try LanguageModel API (the official one per docs)
    if (typeof (globalThis as any).LanguageModel !== 'undefined') {
      console.debug('[ChromeAISummarizer] ✅ Found LanguageModel API (official)');
      try {
        const availability = await (globalThis as any).LanguageModel.availability();
        console.debug('[ChromeAISummarizer] LanguageModel availability:', availability);

        // Map the response to our format
        if (availability === 'available' || availability === 'readily') {
          return 'readily';
        } else if (availability === 'after-download' || availability === 'downloadable') {
          return 'after-download';
        } else {
          return 'no';
        }
      } catch (error) {
        console.error('[ChromeAISummarizer] Error checking LanguageModel:', error);
      }
    }

    // Try window.ai.languageModel
    if ((globalThis as any).ai?.languageModel) {
      console.debug('[ChromeAISummarizer] ✅ Found window.ai.languageModel');
      try {
        const result = await (globalThis as any).ai.languageModel.availability();
        console.debug('[ChromeAISummarizer] window.ai.languageModel availability:', result);
        return (result.available || result) as ChromeAIAvailability;
      } catch (error) {
        console.error('[ChromeAISummarizer] Error checking window.ai.languageModel:', error);
      }
    }

    console.error('[ChromeAISummarizer] ❌ No AI API found in any location');
    console.error('[ChromeAISummarizer] Please enable:');
    console.error('[ChromeAISummarizer] chrome://flags/#prompt-api-for-gemini-nano-multimodal-input');
    console.error('[ChromeAISummarizer] Then restart Chrome completely');
    return 'not-supported';
  }

  /**
   * Get model parameters
   */
  static async getModelParams(): Promise<chrome.ai.AILanguageModelParams | null> {
    try {
      // Try window.ai.languageModel first
      if ((globalThis as any).ai?.languageModel) {
        return await (globalThis as any).ai.languageModel.capabilities();
      }

      // Try chrome.ai.languageModel
      if ((chrome as any).ai?.languageModel) {
        return await (chrome as any).ai.languageModel.capabilities();
      }

      return null;
    } catch (error) {
      console.error('Error getting model params:', error);
      return null;
    }
  }

  /**
   * Download and initialize the model if needed
   */
  async initialize(): Promise<void> {
    let availability = await ChromeAISummarizer.checkAvailability();

    if (availability === 'not-supported' || availability === 'no') {
      throw new Error(
        'Chrome AI is not available. Please use Chrome 128+ with AI features enabled.'
      );
    }

    // If model needs to be downloaded, wait for it
    if (availability === 'after-download') {
      console.debug('[ChromeAISummarizer] Model is downloading, waiting for it to be ready...');

      // Try to create session which triggers download
      try {
        await this.createSession();
        return;
      } catch (error) {
        console.debug('[ChromeAISummarizer] Session creation failed, model still downloading:', error);

        // Poll until ready (max 5 minutes)
        const maxAttempts = 150; // 5 minutes with 2 second intervals
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          availability = await ChromeAISummarizer.checkAvailability();
          console.debug('[ChromeAISummarizer] Polling... availability:', availability);

          if (availability === 'readily') {
            console.debug('[ChromeAISummarizer] Model is now ready!');
            await this.createSession();
            return;
          }
        }

        throw new Error('Model download timed out after 5 minutes. Check chrome://on-device-internals for download status.');
      }
    }

    // Create a session
    await this.createSession();
  }


  /**
   * Create a new session with the configured options
   */
  private async createSession(): Promise<void> {
    const { temperature, topK, systemPrompt, signal } = this.options;

    try {
      // Try LanguageModel API (official API)
      if (typeof (globalThis as any).LanguageModel !== 'undefined') {
        console.debug('[ChromeAISummarizer] Using LanguageModel API (official)');
        const createOptions: any = { signal };

        if (temperature !== undefined) {
          createOptions.temperature = temperature;
        }

        if (topK !== undefined) {
          createOptions.topK = topK;
        }

        if (systemPrompt) {
          createOptions.systemPrompt = systemPrompt;
        }

        this.session = await (globalThis as any).LanguageModel.create(createOptions);
        return;
      }

      // Try window.ai.languageModel
      if ((globalThis as any).ai?.languageModel) {
        console.debug('[ChromeAISummarizer] Using window.ai.languageModel');
        const createOptions: any = { signal };

        if (temperature !== undefined) {
          createOptions.temperature = temperature;
        }

        if (topK !== undefined) {
          createOptions.topK = topK;
        }

        if (systemPrompt) {
          createOptions.systemPrompt = systemPrompt;
        }

        this.session = await (globalThis as any).ai.languageModel.create(createOptions);
        return;
      }

      // Try window.ai.summarizer
      if ((globalThis as any).ai?.summarizer) {
        console.debug('[ChromeAISummarizer] Using window.ai.summarizer');
        this.session = await (globalThis as any).ai.summarizer.create({
          type: 'tldr',
          format: 'plain-text',
          length: 'medium',
          signal,
        }) as any;
        return;
      }

      throw new Error('No Chrome AI API found');
    } catch (error) {
      throw new Error(
        `Failed to create AI session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate a summary using Chrome AI
   */
  async summarize(options: SummarizerOptions): Promise<SummarizerResult> {
    // Initialize if not already done
    if (!this.session) {
      await this.initialize();
    }

    if (!this.session) {
      throw new Error('Failed to initialize Chrome AI session');
    }

    const { title = '', url = '', content = '', maxLength = 200 } = options;

    // Build the prompt
    const prompt = this.buildSummaryPrompt(title, url, content, maxLength);

    try {
      const summary = await this.session.prompt(prompt, {
        signal: this.options.signal,
      });

      return {
        summary: summary.trim(),
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate a summary with streaming response
   */
  async *summarizeStreaming(
    options: SummarizerOptions
  ): AsyncGenerator<string, void, unknown> {
    // Initialize if not already done
    if (!this.session) {
      await this.initialize();
    }

    if (!this.session) {
      throw new Error('Failed to initialize Chrome AI session');
    }

    const { title = '', url = '', content = '', maxLength = 200 } = options;

    // Build the prompt
    const prompt = this.buildSummaryPrompt(title, url, content, maxLength);

    try {
      const stream = this.session.promptStreaming(prompt, {
        signal: this.options.signal,
      });

      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } catch (error) {
      throw new Error(
        `Failed to generate streaming summary: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Build the summary prompt
   */
  private buildSummaryPrompt(
    title: string,
    url: string,
    content: string,
    maxLength: number
  ): string {
    const parts: string[] = [];

    parts.push(
      `Please provide a concise summary (maximum ${maxLength} characters) for the following web page:`
    );

    if (title) {
      parts.push(`\nTitle: ${title}`);
    }

    if (url) {
      parts.push(`URL: ${url}`);
    }

    if (content) {
      parts.push(`\nContent:\n${content}`);
    }

    parts.push(
      '\n\nProvide only the summary text without any preamble or additional commentary.'
    );

    return parts.join('\n');
  }

  /**
   * Get current token usage
   */
  getTokenUsage(): {
    used: number;
    max: number;
    remaining: number;
  } | null {
    if (!this.session) {
      return null;
    }

    return {
      used: this.session.tokensSoFar,
      max: this.session.maxTokens,
      remaining: this.session.tokensLeft,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
  }
}

/**
 * Factory function to create a Chrome AI summarizer
 */
export function createChromeAISummarizer(
  options?: ChromeAISummarizerOptions
): ChromeAISummarizer {
  return new ChromeAISummarizer(options);
}
