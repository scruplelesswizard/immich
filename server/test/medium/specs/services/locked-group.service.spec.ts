import { Kysely } from 'kysely';
import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto.js';
import { AssetVisibility } from 'src/enum.js';
import { AccessRepository } from 'src/repositories/access.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { LockedGroupRepository } from 'src/repositories/locked-group.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { DB } from 'src/schema/index.js';
import { LockedGroupService } from 'src/services/locked-group.service.js';
import { TimelineService } from 'src/services/timeline.service.js';
import { newMediumService } from 'test/medium.factory.js';
import { factory } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

let defaultDatabase: Kysely<DB>;

const setup = () => {
  const options = {
    database: defaultDatabase,
    real: [AssetRepository, AccessRepository, LockedGroupRepository],
    mock: [LoggingRepository],
  };
  const { sut, ctx } = newMediumService(LockedGroupService, options);
  const timeline = newMediumService(TimelineService, options).sut;
  return { sut, ctx, timeline };
};

const newLockedAsset = async (ctx: ReturnType<typeof setup>['ctx'], ownerId: string) => {
  const { asset } = await ctx.newAsset({ ownerId, visibility: AssetVisibility.Locked });
  return asset;
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(LockedGroupService.name, () => {
  it('should group locked assets and filter the timeline by group and by ungrouped', async () => {
    const { sut, ctx, timeline } = setup();
    const { user } = await ctx.newUser();
    const auth = factory.auth({ user, session: { hasElevatedPermission: true } });
    const grouped = await newLockedAsset(ctx, user.id);
    await newLockedAsset(ctx, user.id);
    const group = await sut.create(auth, { name: 'Cards' });

    await expect(sut.addAssets(auth, group.id, { ids: [grouped.id] })).resolves.toEqual([
      { id: grouped.id, success: true },
    ]);

    const bucketIds = async (dto: Parameters<typeof timeline.getTimeBuckets>[1]) => {
      const buckets = await timeline.getTimeBuckets(auth, dto);
      return buckets.reduce((sum, bucket) => sum + bucket.count, 0);
    };

    await expect(bucketIds({ lockedGroupId: group.id })).resolves.toBe(1);
    await expect(bucketIds({ isInLockedGroup: false })).resolves.toBe(1);
    await expect(bucketIds({ visibility: AssetVisibility.Locked })).resolves.toBe(2);
    await expect(sut.get(auth, group.id)).resolves.toMatchObject({ assetCount: 1 });
  });

  it('should refuse assets that are not locked or not owned', async () => {
    const { sut, ctx } = setup();
    const { user } = await ctx.newUser();
    const { user: other } = await ctx.newUser();
    const auth = factory.auth({ user, session: { hasElevatedPermission: true } });
    const { asset: visible } = await ctx.newAsset({ ownerId: user.id });
    const foreign = await newLockedAsset(ctx, other.id);
    const group = await sut.create(auth, { name: 'Private' });

    await expect(sut.addAssets(auth, group.id, { ids: [visible.id, foreign.id] })).resolves.toEqual([
      { id: visible.id, success: false, error: BulkIdErrorReason.VALIDATION },
      { id: foreign.id, success: false, error: BulkIdErrorReason.NO_PERMISSION },
    ]);
  });

  it('should not expose a group of another user', async () => {
    const { sut, ctx } = setup();
    const { user } = await ctx.newUser();
    const { user: other } = await ctx.newUser();
    const group = await sut.create(factory.auth({ user, session: { hasElevatedPermission: true } }), { name: 'Cards' });
    const otherAuth = factory.auth({ user: other, session: { hasElevatedPermission: true } });

    await expect(sut.get(otherAuth, group.id)).rejects.toThrow();
    await expect(sut.getAll(otherAuth)).resolves.toEqual([]);
  });

  it('should keep the assets locked when the group is deleted', async () => {
    const { sut, ctx } = setup();
    const { user } = await ctx.newUser();
    const auth = factory.auth({ user, session: { hasElevatedPermission: true } });
    const asset = await newLockedAsset(ctx, user.id);
    const group = await sut.create(auth, { name: 'Cards' });
    await sut.addAssets(auth, group.id, { ids: [asset.id] });

    await sut.remove(auth, group.id);

    const row = await defaultDatabase
      .selectFrom('asset')
      .select('visibility')
      .where('id', '=', asset.id)
      .executeTakeFirst();
    expect(row?.visibility).toBe(AssetVisibility.Locked);
  });

  it('should drop memberships when an asset leaves the locked folder', async () => {
    const { ctx } = setup();
    const { user } = await ctx.newUser();
    const asset = await newLockedAsset(ctx, user.id);
    const repo = ctx.get(LockedGroupRepository);
    const group = await repo.create({ userId: user.id, name: 'Cards' });
    await repo.addAssetIds(group.id, [asset.id]);

    await repo.removeAssetsFromAll([asset.id]);

    await expect(repo.getAssetIds(group.id, new Set([asset.id]))).resolves.toEqual(new Set());
  });
});
