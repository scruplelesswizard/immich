import { BadRequestException, Injectable } from '@nestjs/common';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto.js';
import { AuthDto } from 'src/dtos/auth.dto.js';
import {
  LockedGroupCreateDto,
  LockedGroupResponseDto,
  LockedGroupUpdateDto,
  mapLockedGroup,
} from 'src/dtos/locked-group.dto.js';
import { Permission } from 'src/enum.js';
import { BaseService } from 'src/services/base.service.js';
import { requireElevatedPermission } from 'src/utils/access.js';
import { findOrFail } from 'src/utils/misc.js';

@Injectable()
export class LockedGroupService extends BaseService {
  async getAll(auth: AuthDto): Promise<LockedGroupResponseDto[]> {
    requireElevatedPermission(auth);
    const groups = await this.lockedGroupRepository.getAll(auth.user.id);
    return groups.map((group) => mapLockedGroup(group, group.assetCount));
  }

  async get(auth: AuthDto, id: string): Promise<LockedGroupResponseDto> {
    requireElevatedPermission(auth);
    await this.requireAccess({ auth, permission: Permission.LockedGroupRead, ids: [id] });
    const group = await this.findOrFail(id);
    return mapLockedGroup(group, group.assetCount);
  }

  async create(auth: AuthDto, dto: LockedGroupCreateDto): Promise<LockedGroupResponseDto> {
    requireElevatedPermission(auth);
    await this.assertNameAvailable(auth.user.id, dto.name);
    const group = await this.lockedGroupRepository.create({ userId: auth.user.id, name: dto.name });
    return mapLockedGroup(group);
  }

  async update(auth: AuthDto, id: string, dto: LockedGroupUpdateDto): Promise<LockedGroupResponseDto> {
    requireElevatedPermission(auth);
    await this.requireAccess({ auth, permission: Permission.LockedGroupUpdate, ids: [id] });
    await this.assertNameAvailable(auth.user.id, dto.name, id);
    await this.lockedGroupRepository.update(id, { name: dto.name });
    const group = await this.findOrFail(id);
    return mapLockedGroup(group, group.assetCount);
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    requireElevatedPermission(auth);
    await this.requireAccess({ auth, permission: Permission.LockedGroupDelete, ids: [id] });
    await this.lockedGroupRepository.delete(id);
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    requireElevatedPermission(auth);
    await this.requireAccess({ auth, permission: Permission.LockedGroupAsset, ids: [id] });

    const requestedIds = new Set(dto.ids);
    const existingIds = await this.lockedGroupRepository.getAssetIds(id, requestedIds);
    const ownedIds = await this.checkAccess({ auth, permission: Permission.AssetUpdate, ids: requestedIds });
    const lockedIds = await this.lockedGroupRepository.getLockedAssetIds(auth.user.id, ownedIds);

    const results: BulkIdResponseDto[] = [];
    const addedIds: string[] = [];
    for (const assetId of dto.ids) {
      if (existingIds.has(assetId)) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.DUPLICATE });
      } else if (!ownedIds.has(assetId)) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
      } else if (lockedIds.has(assetId)) {
        existingIds.add(assetId);
        addedIds.push(assetId);
        results.push({ id: assetId, success: true });
      } else {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.VALIDATION });
      }
    }

    await this.lockedGroupRepository.addAssetIds(id, addedIds);
    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    requireElevatedPermission(auth);
    await this.requireAccess({ auth, permission: Permission.LockedGroupAsset, ids: [id] });

    const existingIds = await this.lockedGroupRepository.getAssetIds(id, new Set(dto.ids));

    const results: BulkIdResponseDto[] = [];
    const removedIds: string[] = [];
    for (const assetId of dto.ids) {
      if (existingIds.has(assetId)) {
        existingIds.delete(assetId);
        removedIds.push(assetId);
        results.push({ id: assetId, success: true });
      } else {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NOT_FOUND });
      }
    }

    await this.lockedGroupRepository.removeAssetIds(id, removedIds);
    return results;
  }

  private findOrFail(id: string) {
    return findOrFail(() => this.lockedGroupRepository.get(id), 'Locked group');
  }

  private async assertNameAvailable(userId: string, name: string, ownId?: string) {
    const duplicate = await this.lockedGroupRepository.getByName(userId, name);
    if (duplicate && duplicate.id !== ownId) {
      throw new BadRequestException('A locked group with that name already exists');
    }
  }
}
