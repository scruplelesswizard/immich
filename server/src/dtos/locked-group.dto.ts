import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { LockedGroup } from 'src/database.js';
import { MaybeDehydrated } from 'src/types.js';
import { asDateTimeString } from 'src/utils/date.js';

const LockedGroupNameSchema = z.string().trim().min(1).max(100).describe('Locked group name');

const LockedGroupCreateSchema = z.object({ name: LockedGroupNameSchema }).meta({ id: 'LockedGroupCreateDto' });

const LockedGroupUpdateSchema = z.object({ name: LockedGroupNameSchema }).meta({ id: 'LockedGroupUpdateDto' });

const LockedGroupResponseSchema = z
  .object({
    id: z.uuidv4().describe('Locked group ID'),
    name: z.string().describe('Locked group name'),
    assetCount: z.int().min(0).describe('Number of locked assets in the group'),
    createdAt: z.string().meta({ format: 'date-time' }).describe('Creation date'),
    updatedAt: z.string().meta({ format: 'date-time' }).describe('Last update date'),
  })
  .meta({ id: 'LockedGroupResponseDto' });

export class LockedGroupCreateDto extends createZodDto(LockedGroupCreateSchema) {}
export class LockedGroupUpdateDto extends createZodDto(LockedGroupUpdateSchema) {}
export class LockedGroupResponseDto extends createZodDto(LockedGroupResponseSchema) {}

export function mapLockedGroup(
  entity: MaybeDehydrated<LockedGroup>,
  assetCount: number | null = 0,
): LockedGroupResponseDto {
  return {
    id: entity.id,
    name: entity.name,
    assetCount: Number(assetCount ?? 0),
    createdAt: asDateTimeString(entity.createdAt),
    updatedAt: asDateTimeString(entity.updatedAt),
  };
}
