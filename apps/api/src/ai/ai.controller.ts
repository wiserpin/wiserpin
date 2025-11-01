import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { AiService } from './ai.service';
import { SummarizeContentDto } from './dto/summarize.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  @ApiOperation({ summary: 'Summarize content using Gemini AI' })
  async summarize(@Body() dto: SummarizeContentDto) {
    return this.aiService.summarizeContent(dto.content, dto.title);
  }
}
