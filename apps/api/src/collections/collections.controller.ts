import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/user.decorator';

@ApiTags('collections')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() createCollectionDto: CreateCollectionDto,
  ) {
    return this.collectionsService.create(user.userId, createCollectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all collections for the current user' })
  findAll(@CurrentUser() user: { userId: string }) {
    return this.collectionsService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single collection by ID' })
  findOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.collectionsService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collection' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ) {
    return this.collectionsService.update(user.userId, id, updateCollectionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection' })
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.collectionsService.remove(user.userId, id);
  }
}
