import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCollectionDto {
  @ApiPropertyOptional({ description: 'Collection ID (UUID)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Collection name', example: 'My Collection' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Collection description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Collection color (hex)', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Collection icon', example: '📁' })
  @IsOptional()
  @IsString()
  icon?: string;
}
