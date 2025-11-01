/**
 * Browser AI Capabilities Detection and Utilities
 * Checks for Chrome's built-in AI (Gemini Nano) support
 * Uses the Summarizer API (chrome://flags/#summarization-api-for-gemini-nano)
 */

// Type definitions for Chrome's experimental AI APIs
declare global {
  interface Window {
    // Old API (working) - Used by extension
    Summarizer?: {
      create(options: {
        type?: 'tldr' | 'key-points' | 'teaser' | 'headline';
        format?: 'plain-text' | 'markdown';
        length?: 'short' | 'medium' | 'long';
        monitor?: (m: any) => void;
      }): Promise<AISummarizer>;
    };

    // New API (for future compatibility)
    ai?: {
      summarizer?: {
        capabilities(): Promise<{
          available: 'readily' | 'after-download' | 'no';
        }>;
        create(options?: {
          sharedContext?: string;
          type?: 'tl;dr' | 'key-points' | 'teaser' | 'headline';
          format?: 'plain-text' | 'markdown';
          length?: 'short' | 'medium' | 'long';
        }): Promise<AISummarizer>;
      };
      languageModel?: {
        capabilities(): Promise<{
          available: 'readily' | 'after-download' | 'no';
        }>;
        create(options?: {
          systemPrompt?: string;
          temperature?: number;
          topK?: number;
        }): Promise<AILanguageModel>;
      };
    };
  }

  interface AISummarizer {
    summarize(text: string, options?: { context?: string }): Promise<string>;
    destroy(): void;
  }

  interface AILanguageModel {
    prompt(text: string): Promise<string>;
    destroy(): void;
  }
}

export interface BrowserAICapabilities {
  summarizer: boolean;
  languageModel: boolean;
}

/**
 * Check if the browser supports Chrome's built-in AI APIs
 * Checks the old Summarizer API (same as extension)
 */
export async function checkBrowserAICapabilities(): Promise<BrowserAICapabilities> {
  const capabilities: BrowserAICapabilities = {
    summarizer: false,
    languageModel: false,
  };

  try {
    // Check old Summarizer API (working in extension)
    if (typeof (window as any).Summarizer !== 'undefined') {
      console.log('[Browser AI] Old Summarizer API found');
      capabilities.summarizer = true;
      capabilities.languageModel = true; // Summarizer can be used for both
    }
    // Fallback: Check new API
    else if (window.ai?.summarizer) {
      console.log('[Browser AI] New window.ai.summarizer API found');
      const summarizerCaps = await window.ai.summarizer.capabilities();
      capabilities.summarizer = summarizerCaps.available === 'readily';
    }

    // Check language model availability (new API)
    if (window.ai?.languageModel) {
      const languageModelCaps = await window.ai.languageModel.capabilities();
      capabilities.languageModel = languageModelCaps.available === 'readily';
    }
  } catch (error) {
    console.error('Error checking browser AI capabilities:', error);
  }

  console.log('[Browser AI] Capabilities:', capabilities);
  return capabilities;
}

/**
 * Create a summarizer instance using Chrome's built-in AI
 * Uses the old Summarizer API (same as extension)
 * @throws Error if summarizer is not available
 */
export async function createBrowserSummarizer(): Promise<AISummarizer> {
  // Try old API first (working in extension)
  if (typeof (window as any).Summarizer !== 'undefined') {
    console.log('[Browser AI] Creating summarizer with old API');
    return await (window as any).Summarizer.create({
      type: 'tldr',
      format: 'plain-text',
      length: 'medium',
    });
  }

  // Fallback to new API
  if (!window.ai?.summarizer) {
    throw new Error('Browser AI summarizer not available. Enable chrome://flags/#summarization-api-for-gemini-nano');
  }

  console.log('[Browser AI] Creating summarizer with new API');
  const capabilities = await window.ai.summarizer.capabilities();
  if (capabilities.available !== 'readily') {
    throw new Error('Browser AI summarizer not ready');
  }

  return await window.ai.summarizer.create({
    type: 'tl;dr',
    format: 'plain-text',
    length: 'medium',
  });
}

/**
 * Create a language model instance using Chrome's built-in AI
 * For now, uses the Summarizer API for categorization (same as extension)
 * @throws Error if language model is not available
 */
export async function createBrowserLanguageModel(systemPrompt?: string): Promise<AILanguageModel> {
  // Use Summarizer API for categorization (same as extension does)
  if (typeof (window as any).Summarizer !== 'undefined') {
    console.log('[Browser AI] Creating language model using Summarizer API');
    const summarizer = await (window as any).Summarizer.create({
      type: 'tldr',
      format: 'plain-text',
      length: 'short',
    });

    // Wrap summarizer to match language model interface
    return {
      prompt: async (text: string) => {
        const promptWithContext = systemPrompt ? `${systemPrompt}\n\n${text}` : text;
        return await summarizer.summarize(promptWithContext);
      },
      destroy: () => summarizer.destroy(),
    };
  }

  // Fallback to new language model API
  if (!window.ai?.languageModel) {
    throw new Error('Browser AI language model not available');
  }

  console.log('[Browser AI] Creating language model with new API');
  const capabilities = await window.ai.languageModel.capabilities();
  if (capabilities.available !== 'readily') {
    throw new Error('Browser AI language model not ready');
  }

  return await window.ai.languageModel.create({
    systemPrompt,
    temperature: 0.7,
    topK: 40,
  });
}
