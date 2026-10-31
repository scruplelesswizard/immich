import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto.js';
import { LockedGroupService } from 'src/services/locked-group.service.js';
import { authStub } from 'test/fixtures/auth.stub.js';
import { ServiceMocks, newTestService } from 'test/utils.js';

const auth = authStub.adminWithElevatedPermission;
const createdAt = new Date('2026-01-01T00:00:00.000Z');
const group = { id: 'group-1', name: 'Cards', createdAt, updatedAt: createdAt };

describe(LockedGroupService.name, () => {
  let sut: LockedGroupService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(LockedGroupService));
    mocks.access.lockedGroup.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
  });

  describe('without an elevated session', () => {
    it.each([
      ['getAll', () => sut.getAll(authStub.admin)],
      ['get', () => sut.get(authStub.admin, 'group-1')],
      ['create', () => sut.create(authStub.admin, { name: 'Cards' })],
      ['update', () => sut.update(authStub.admin, 'group-1', { name: 'Cards' })],
      ['remove', () => sut.remove(authStub.admin, 'group-1')],
      ['addAssets', () => sut.addAssets(authStub.admin, 'group-1', { ids: ['asset-1'] })],
      ['removeAssets', () => sut.removeAssets(authStub.admin, 'group-1', { ids: ['asset-1'] })],
    ])('should reject %s', async (_, call) => {
      await expect(call()).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getAll', () => {
    it('should return the groups with their asset counts', async () => {
      mocks.lockedGroup.getAll.mockResolvedValue([{ ...group, assetCount: 3 }]);
      await expect(sut.getAll(auth)).resolves.toEqual([
        {
          id: 'group-1',
          name: 'Cards',
          assetCount: 3,
          createdAt: createdAt.toISOString(),
          updatedAt: createdAt.toISOString(),
        },
      ]);
      expect(mocks.lockedGroup.getAll).toHaveBeenCalledWith(auth.user.id);
    });
  });

  describe('get', () => {
    it('should require ownership', async () => {
      mocks.access.lockedGroup.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.get(auth, 'group-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.lockedGroup.get).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should reject a duplicate name', async () => {
      mocks.lockedGroup.getByName.mockResolvedValue(group);
      await expect(sut.create(auth, { name: 'Cards' })).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.lockedGroup.create).not.toHaveBeenCalled();
    });

    it('should create a group for the user', async () => {
      mocks.lockedGroup.create.mockResolvedValue(group);
      await expect(sut.create(auth, { name: 'Cards' })).resolves.toMatchObject({ id: 'group-1', assetCount: 0 });
      expect(mocks.lockedGroup.create).toHaveBeenCalledWith({ userId: auth.user.id, name: 'Cards' });
    });
  });

  describe('update', () => {
    it('should allow keeping the own name', async () => {
      mocks.lockedGroup.getByName.mockResolvedValue(group);
      mocks.lockedGroup.get.mockResolvedValue({ ...group, assetCount: 2 });
      await expect(sut.update(auth, 'group-1', { name: 'Cards' })).resolves.toMatchObject({ assetCount: 2 });
      expect(mocks.lockedGroup.update).toHaveBeenCalledWith('group-1', { name: 'Cards' });
    });

    it('should reject the name of another group', async () => {
      mocks.lockedGroup.getByName.mockResolvedValue({ ...group, id: 'group-2' });
      await expect(sut.update(auth, 'group-1', { name: 'Cards' })).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.lockedGroup.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete the group only', async () => {
      await sut.remove(auth, 'group-1');
      expect(mocks.lockedGroup.delete).toHaveBeenCalledWith('group-1');
      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
    });

    it('should require ownership', async () => {
      mocks.access.lockedGroup.checkOwnerAccess.mockResolvedValue(new Set());
      await expect(sut.remove(auth, 'group-1')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.lockedGroup.delete).not.toHaveBeenCalled();
    });
  });

  describe('addAssets', () => {
    it('should add only owned locked assets that are not yet members', async () => {
      mocks.lockedGroup.getAssetIds.mockResolvedValue(new Set(['member']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['member', 'locked', 'visible']));
      mocks.lockedGroup.getLockedAssetIds.mockResolvedValue(new Set(['member', 'locked']));

      const result = await sut.addAssets(auth, 'group-1', { ids: ['member', 'locked', 'visible', 'foreign'] });

      expect(result).toEqual([
        { id: 'member', success: false, error: BulkIdErrorReason.DUPLICATE },
        { id: 'locked', success: true },
        { id: 'visible', success: false, error: BulkIdErrorReason.VALIDATION },
        { id: 'foreign', success: false, error: BulkIdErrorReason.NO_PERMISSION },
      ]);
      expect(mocks.lockedGroup.addAssetIds).toHaveBeenCalledWith('group-1', ['locked']);
    });
  });

  describe('removeAssets', () => {
    it('should remove members and report the others as not found', async () => {
      mocks.lockedGroup.getAssetIds.mockResolvedValue(new Set(['member']));

      const result = await sut.removeAssets(auth, 'group-1', { ids: ['member', 'other'] });

      expect(result).toEqual([
        { id: 'member', success: true },
        { id: 'other', success: false, error: BulkIdErrorReason.NOT_FOUND },
      ]);
      expect(mocks.lockedGroup.removeAssetIds).toHaveBeenCalledWith('group-1', ['member']);
    });
  });
});
