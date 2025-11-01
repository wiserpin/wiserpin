/**
 * Summarizer Service with Browser AI + API Fallback
 * Priority: Browser AI (Gemini Nano) → API (Gemini Cloud)
 */

import { checkBrowserAICapabilities, createBrowserSummarizer, createBrowserLanguageModel } from './browser-ai';
import { api } from './api';

export interface SummaryResult {
  summary: string;
  category?: string;
  usedBrowserAI: boolean;
}

class SummarizerService {
  private browserAIAvailable: boolean | null = null;
  private checkingCapabilities = false;

  /**
   * Check and cache browser AI capabilities
   */
  async checkCapabilities(): Promise<boolean> {
    if (this.browserAIAvailable !== null) {
      return this.browserAIAvailable;
    }

    if (this.checkingCapabilities) {
      // Wait for ongoing check
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.checkCapabilities();
    }

    this.checkingCapabilities = true;
    try {
      const capabilities = await checkBrowserAICapabilities();
      this.browserAIAvailable = capabilities.summarizer && capabilities.languageModel;
      console.log('[Summarizer] Browser AI available:', this.browserAIAvailable);
      return this.browserAIAvailable;
    } catch (error) {
      console.error('[Summarizer] Error checking capabilities:', error);
      this.browserAIAvailable = false;
      return false;
    } finally {
      this.checkingCapabilities = false;
    }
  }

  /**
   * Summarize content using browser AI
   */
  private async summarizeWithBrowserAI(content: string): Promise<string> {
    const summarizer = await createBrowserSummarizer();
    try {
      const summary = await summarizer.summarize(content);
      return summary;
    } finally {
      summarizer.destroy();
    }
  }

  /**
   * Categorize content using browser AI language model
   */
  private async categorizeWithBrowserAI(summary: string): Promise<string> {
    const languageModel = await createBrowserLanguageModel(
      'You are a content categorization assistant. Given a summary, suggest a single, specific category name (2-3 words max). ' +
      'Choose from common categories like: Technology, Business, Education, Health, Entertainment, News, Design, Development, Marketing, Science, etc. ' +
      'Respond with ONLY the category name, nothing else.'
    );

    try {
      const category = await languageModel.prompt(
        `Based on this summary, what category does this content belong to?\n\nSummary: ${summary}\n\nCategory:`
      );
      return category.trim();
    } finally {
      languageModel.destroy();
    }
  }

  /**
   * Summarize and categorize content
   * Tries browser AI first, falls back to API
   */
  async summarizeAndCategorize(content: string, title?: string): Promise<SummaryResult> {
    const hasTitle = title && title.trim().length > 0;
    const fullContent = hasTitle ? `Title: ${title}\n\n${content}` : content;

    // Check if browser AI is available
    const browserAIAvailable = await this.checkCapabilities();

    if (browserAIAvailable) {
      try {
        console.log('[Summarizer] Using browser AI');
        const summary = await this.summarizeWithBrowserAI(fullContent);

        // Try to get category
        let category: string | undefined;
        try {
          category = await this.categorizeWithBrowserAI(summary);
        } catch (error) {
          console.warn('[Summarizer] Browser AI categorization failed:', error);
          // Continue without category
        }

        return {
          summary,
          category,
          usedBrowserAI: true,
        };
      } catch (error) {
        console.warn('[Summarizer] Browser AI failed, falling back to API:', error);
        // Fall through to API fallback
      }
    }

    // Fallback to API
    console.log('[Summarizer] Using API fallback');
    try {
      const result = await api.summarizeContent({
        content: fullContent,
        title,
      });
      return {
        summary: result.summary,
        category: result.category,
        usedBrowserAI: false,
      };
    } catch (error) {
      console.error('[Summarizer] API fallback failed:', error);
      throw new Error('Failed to generate summary. Please try again.');
    }
  }

  /**
   * Summarize URL content by fetching it first
   */
  async summarizeUrl(url: string): Promise<SummaryResult> {
    try {
      // Fetch URL content
      const response = await fetch(url, { mode: 'cors' });
      const html = await response.text();

      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract title
      const title =
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.querySelector('title')?.textContent ||
        '';

      // Extract main content (remove scripts, styles, etc.)
      const elementsToRemove = doc.querySelectorAll('script, style, nav, header, footer, aside');
      elementsToRemove.forEach(el => el.remove());

      // Get text content
      const content = doc.body.textContent || '';

      // Clean up whitespace
      const cleanedContent = content
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 10000); // Limit to first 10k characters

      if (cleanedContent.length < 50) {
        throw new Error('Not enough content to summarize');
      }

      return await this.summarizeAndCategorize(cleanedContent, title);
    } catch (error) {
      console.error('[Summarizer] URL fetch failed:', error);
      throw new Error('Failed to fetch URL content. You can still add a manual summary.');
    }
  }

  /**
   * Suggest which collection a page belongs to
   * Uses browser AI first (same as extension), with keyword fallback
   */
  async suggestCollection(params: {
    title: string;
    url: string;
    summary?: string;
    collections: Array<{ id: string; name: string; description?: string }>;
  }): Promise<string | null> {
    const { title, url, summary, collections } = params;

    if (collections.length === 0) {
      return null;
    }

    // Check if browser AI is available
    const browserAIAvailable = await this.checkCapabilities();

    if (browserAIAvailable && typeof (window as any).Summarizer !== 'undefined') {
      try {
        console.log('[Summarizer] Using browser AI for collection suggestion');

        // Create session
        const session = await (window as any).Summarizer.create({
          type: 'tldr',
          format: 'plain-text',
          length: 'short',
        });

        // Build prompt (same as extension)
        const collectionsText = collections
          .map((c) => `- ${c.name} (ID: ${c.id})${c.description ? ` - Goal: ${c.description}` : ''}`)
          .join('\n');

        const prompt = `Analyze this web page and choose which collection it belongs to based on the collection goals.

Page: ${title}
URL: ${url}
${summary ? `Summary: ${summary}` : ''}

Available Collections:
${collectionsText}

Which collection ID best matches this page based on its goal? Respond with ONLY the ID.`;

        const response = await session.summarize(prompt);
        session.destroy();

        console.log('[Summarizer] AI Response:', response);

        // Extract collection ID from response
        const responseText = response.trim();

        // Try to find exact ID match first
        for (const c of collections) {
          if (responseText.includes(c.id)) {
            console.log('[Summarizer] Found exact ID match:', c.id);
            return c.id;
          }
        }

        // Try matching by name
        for (const c of collections) {
          if (responseText.toLowerCase().includes(c.name.toLowerCase())) {
            console.log('[Summarizer] Found name match:', c.id);
            return c.id;
          }
        }

        // Fall through to keyword matching
        console.log('[Summarizer] No direct match, falling back to keyword matching');
      } catch (error) {
        console.warn('[Summarizer] Browser AI collection suggestion failed:', error);
      }
    }

    // Keyword matching fallback (same as extension)
    console.log('[Summarizer] Using keyword matching fallback');
    const pageText = `${title} ${url} ${summary || ''}`.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const c of collections) {
      if (c.description) {
        // Extract keywords from description (remove common words)
        const keywords = c.description
          .toLowerCase()
          .split(/\s+/)
          .filter(
            (word: string) =>
              word.length > 3 && !['this', 'that', 'with', 'from', 'have', 'will'].includes(word)
          );

        // Count keyword matches
        let score = 0;
        for (const keyword of keywords) {
          if (pageText.includes(keyword)) {
            score++;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = c.id;
        }
      }
    }

    // If keyword matching found a match, use it; otherwise use first collection
    const finalId = bestMatch || collections[0].id;
    console.log(`[Summarizer] Fallback selected: ${finalId} (score: ${bestScore})`);
    return finalId;
  }
}

export const summarizerService = new SummarizerService();
