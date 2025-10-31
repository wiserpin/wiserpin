import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePinDto } from "./dto/create-pin.dto";
import { UpdatePinDto } from "./dto/update-pin.dto";

@Injectable()
export class PinsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createPinDto: CreatePinDto) {
    // Ensure user exists (create if not)
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
      },
    });

    // Verify collection belongs to user if provided (skip for upsert with ID)
    if (createPinDto.collectionId && !createPinDto.id) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: createPinDto.collectionId },
      });

      if (!collection || collection.userId !== userId) {
        throw new ForbiddenException("Invalid collection");
      }
    }

    // If ID is provided, check if it already exists
    if (createPinDto.id) {
      const existing = await this.prisma.pin.findUnique({
        where: { id: createPinDto.id },
        include: {
          collection: true,
        },
      });

      if (existing) {
        return existing;
      }

      return this.prisma.pin.create({
        data: {
          id: createPinDto.id,
          url: createPinDto.url,
          title: createPinDto.title,
          description: createPinDto.description,
          imageUrl: createPinDto.imageUrl,
          favicon: createPinDto.favicon,
          tags: createPinDto.tags || [],
          collectionId: createPinDto.collectionId,
          userId,
        },
        include: {
          collection: true,
        },
      });
    }

    // Check for duplicate URL (only for new pins without ID)
    const existing = await this.prisma.pin.findUnique({
      where: {
        userId_url: {
          userId,
          url: createPinDto.url,
        },
      },
    });

    if (existing) {
      throw new ConflictException("You have already saved this URL");
    }

    // Otherwise create normally with auto-generated ID
    return this.prisma.pin.create({
      data: {
        ...createPinDto,
        userId,
        tags: createPinDto.tags || [],
      },
      include: {
        collection: true,
      },
    });
  }

  async findAll(userId: string, collectionId?: string) {
    return this.prisma.pin.findMany({
      where: {
        userId,
        ...(collectionId && { collectionId }),
      },
      include: {
        collection: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const pin = await this.prisma.pin.findUnique({
      where: { id },
      include: {
        collection: true,
      },
    });

    if (!pin) {
      throw new NotFoundException("Pin not found");
    }

    if (pin.userId !== userId) {
      throw new ForbiddenException("You do not have access to this pin");
    }

    return pin;
  }

  async update(userId: string, id: string, updatePinDto: UpdatePinDto) {
    const pin = await this.prisma.pin.findUnique({
      where: { id },
    });

    if (!pin) {
      throw new NotFoundException("Pin not found");
    }

    if (pin.userId !== userId) {
      throw new ForbiddenException("You do not have access to this pin");
    }

    // Verify collection belongs to user if changing collection
    if (updatePinDto.collectionId) {
      const collection = await this.prisma.collection.findUnique({
        where: { id: updatePinDto.collectionId },
      });

      if (!collection || collection.userId !== userId) {
        throw new ForbiddenException("Invalid collection");
      }
    }

    return this.prisma.pin.update({
      where: { id },
      data: updatePinDto,
      include: {
        collection: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const pin = await this.prisma.pin.findUnique({
      where: { id },
    });

    if (!pin) {
      throw new NotFoundException("Pin not found");
    }

    if (pin.userId !== userId) {
      throw new ForbiddenException("You do not have access to this pin");
    }

    return this.prisma.pin.delete({
      where: { id },
    });
  }
}
