import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createCollectionDto: CreateCollectionDto) {
    // Ensure user exists (create if not)
    await this.prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
      },
    });

    // If ID is provided, check if it already exists
    if (createCollectionDto.id) {
      console.log(`[CollectionsService] Checking if collection exists with ID: ${createCollectionDto.id}`);
      const existing = await this.prisma.collection.findUnique({
        where: { id: createCollectionDto.id },
        include: {
          _count: {
            select: { pins: true },
          },
        },
      });

      if (existing) {
        console.log(`[CollectionsService] Collection already exists with ID: ${createCollectionDto.id}, returning existing`);
        return existing;
      }

      console.log(`[CollectionsService] Creating NEW collection with provided ID: ${createCollectionDto.id}, name: ${createCollectionDto.name}`);
      return this.prisma.collection.create({
        data: {
          id: createCollectionDto.id,
          name: createCollectionDto.name,
          description: createCollectionDto.description,
          color: createCollectionDto.color,
          userId,
        },
        include: {
          _count: {
            select: { pins: true },
          },
        },
      });
    }

    // Otherwise create normally with auto-generated ID
    console.log(`[CollectionsService] Creating collection with auto-generated ID, name: ${createCollectionDto.name}`);
    return this.prisma.collection.create({
      data: {
        ...createCollectionDto,
        userId,
      },
      include: {
        _count: {
          select: { pins: true },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.collection.findMany({
      where: { userId },
      include: {
        _count: {
          select: { pins: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        pins: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { pins: true },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You do not have access to this collection');
    }

    return collection;
  }

  async update(userId: string, id: string, updateCollectionDto: UpdateCollectionDto) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You do not have access to this collection');
    }

    return this.prisma.collection.update({
      where: { id },
      data: updateCollectionDto,
      include: {
        _count: {
          select: { pins: true },
        },
      },
    });
  }

  async remove(userId: string, id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId) {
      throw new ForbiddenException('You do not have access to this collection');
    }

    return this.prisma.collection.delete({
      where: { id },
    });
  }
}
