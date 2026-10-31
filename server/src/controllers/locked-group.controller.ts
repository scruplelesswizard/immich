import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import { Endpoint, HistoryBuilder } from 'src/decorators.js';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto.js';
import { LockedGroupCreateDto, LockedGroupResponseDto, LockedGroupUpdateDto } from 'src/dtos/locked-group.dto.js';
import { ApiTag, Permission } from 'src/enum.js';
import { Auth, Authenticated } from 'src/middleware/auth.guard.js';
import { LockedGroupService } from 'src/services/locked-group.service.js';
import { UUIDParamDto } from 'src/validation.js';

@ApiTags(ApiTag.LockedGroups)
@Controller('locked-groups')
export class LockedGroupController {
  constructor(private service: LockedGroupService) {}

  @Post()
  @Authenticated({ permission: Permission.LockedGroupCreate })
  @Endpoint({
    summary: 'Create a locked group',
    description: 'Create a named group inside the locked folder. Requires an elevated session.',
    history: new HistoryBuilder().added('v3.4.0'),
  })
  createLockedGroup(@Auth() auth: AuthDto, @Body() dto: LockedGroupCreateDto): Promise<LockedGroupResponseDto> {
    return this.service.create(auth, dto);
  }

  @Get()
  @Authenticated({ permission: Permission.LockedGroupRead })
  @Endpoint({
    summary: 'Retrieve locked groups',
    description: 'Retrieve all locked groups of the current user. Requires an elevated session.',
    history: new HistoryBuilder().added('v3.4.0'),
  })
  getLockedGroups(@Auth() auth: AuthDto): Promise<LockedGroupResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.LockedGroupRead })
  @Endpoint({
    summary: 'Retrieve a locked group',
    description: 'Retrieve a specific locked group by its ID. Requires an elevated session.',
    history: new HistoryBuilder().added('v3.4.0'),
  })
  getLockedGroup(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<LockedGroupResponseDto> {
    return this.service.get(auth, id);
  }

  @Put(':id')
  @Authenticated({ permission: Permission.LockedGroupUpdate })
  @Endpoint({
    summary: 'Update a locked group',
    description: 'Rename a locked group. Requires an elevated session.',
    history: new HistoryBuilder().added('v3.4.0'),
  })
  updateLockedGroup(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: LockedGroupUpdateDto,
  ): Promise<LockedGroupResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.LockedGroupDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a locked group',
    description: 'Delete a locked group. The assets in it stay locked. Requires an elevated session.',
    history: new HistoryBuilder().added('v3.4.0'),
  })
  deleteLockedGroup(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<void> {
    return this.service.remove(auth, id);
  }

  @Put(':id/assets')
  @Authenticated({ permission: Permission.LockedGroupAsset })
  @Endpoint({
    summary: 'Add assets to a locked group',
    description: 'Add locked assets to a locked group. Requires an elevated session.',
    history: new HistoryBuilder().added('v3.4.0'),
  })
  addAssetsToLockedGroup(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.addAssets(auth, id, dto);
  }

  @Delete(':id/assets')
  @Authenticated({ permission: Permission.LockedGroupAsset })
  @Endpoint({
    summary: 'Remove assets from a locked group',
    description: 'Remove assets from a locked group without unlocking them. Requires an elevated session.',
    history: new HistoryBuilder().added('v3.4.0'),
  })
  removeAssetsFromLockedGroup(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDParamDto,
    @Body() dto: BulkIdsDto,
  ): Promise<BulkIdResponseDto[]> {
    return this.service.removeAssets(auth, id, dto);
  }
}
