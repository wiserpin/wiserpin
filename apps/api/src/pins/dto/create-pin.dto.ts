import { IsString, IsOptional, IsUrl, IsArray, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePinDto {
  @ApiPropertyOptional({ description: 'Pin ID (UUID)' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Pin URL', example: 'https://example.com' })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiProperty({ description: 'Pin title', example: 'Example Website' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Pin description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Favicon URL' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  favicon?: string;

  @ApiPropertyOptional({ description: 'Tags', example: ['web', 'design'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Collection ID' })
  @IsOptional()
  @IsUUID()
  collectionId?: string;
}
