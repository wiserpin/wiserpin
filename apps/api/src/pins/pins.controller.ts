import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { PinsService } from "./pins.service";
import { CreatePinDto } from "./dto/create-pin.dto";
import { UpdatePinDto } from "./dto/update-pin.dto";
import { ClerkAuthGuard } from "../auth/clerk-auth.guard";
import { CurrentUser } from "../auth/user.decorator";

@ApiTags("pins")
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller("pins")
export class PinsController {
  constructor(private readonly pinsService: PinsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new pin" })
  create(
    @CurrentUser() user: { userId: string },
    @Body() createPinDto: CreatePinDto,
  ) {
    return this.pinsService.create(user.userId, createPinDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all pins for the current user" })
  @ApiQuery({
    name: "collectionId",
    required: false,
    description: "Filter by collection ID",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Search pins by title, description, or URL",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page (default: 12)",
  })
  findAll(
    @CurrentUser() user: { userId: string },
    @Query("collectionId") collectionId?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 12;
    return this.pinsService.findAll(user.userId, {
      collectionId,
      search,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single pin by ID" })
  findOne(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.pinsService.findOne(user.userId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a pin" })
  update(
    @CurrentUser() user: { userId: string },
    @Param("id") id: string,
    @Body() updatePinDto: UpdatePinDto,
  ) {
    return this.pinsService.update(user.userId, id, updatePinDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a pin" })
  remove(@CurrentUser() user: { userId: string }, @Param("id") id: string) {
    return this.pinsService.remove(user.userId, id);
  }
}
