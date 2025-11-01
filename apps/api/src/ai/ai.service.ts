import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY not set. AI summarization fallback will not work.',
      );
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini AI initialized successfully');
    }
  }

  async summarizeContent(
    content: string,
    title?: string,
  ): Promise<{ summary: string; category?: string }> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

      const fullContent = title ? `Title: ${title}\n\n${content}` : content;

      // Generate summary
      const summaryPrompt = `Summarize the following content in 2-3 sentences. Focus on the main points and key takeaways:\n\n${fullContent}`;

      const summaryResult = await model.generateContent(summaryPrompt);
      const summary = summaryResult.response.text().trim();

      // Generate category
      const categoryPrompt = `Based on this summary, suggest a single, specific category name (2-3 words max). Choose from common categories like: Technology, Business, Education, Health, Entertainment, News, Design, Development, Marketing, Science, etc. Respond with ONLY the category name, nothing else.\n\nSummary: ${summary}`;

      const categoryResult = await model.generateContent(categoryPrompt);
      const category = categoryResult.response.text().trim();

      this.logger.log(
        `Generated summary (${summary.length} chars) and category: ${category}`,
      );

      return {
        summary,
        category,
      };
    } catch (error) {
      this.logger.error('Failed to generate summary:', error);
      throw new Error('Failed to generate summary using Gemini');
    }
  }
}
