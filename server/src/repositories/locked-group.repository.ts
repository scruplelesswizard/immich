import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import type { ExpressionBuilder, Insertable, Kysely, Updateable } from 'kysely';

import { columns } from 'src/database.js';
import { ChunkedArray, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators.js';
import { AssetVisibility } from 'src/enum.js';
import { DB } from 'src/schema/index.js';
import { LockedGroupTable } from 'src/schema/tables/locked-group.table.js';

const withAssetCount = (eb: ExpressionBuilder<DB, 'locked_group'>) =>
  eb
    .selectFrom('locked_group_asset')
    .innerJoin('asset', 'asset.id', 'locked_group_asset.assetId')
    .whereRef('locked_group_asset.lockedGroupId', '=', 'locked_group.id')
    .where('asset.visibility', '=', AssetVisibility.Locked)
    .where('asset.deletedAt', 'is', null)
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .as('assetCount');

@Injectable()
export class LockedGroupRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.db
      .selectFrom('locked_group')
      .select(columns.lockedGroup)
      .select(withAssetCount)
      .where('id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByName(userId: string, name: string) {
    return this.db
      .selectFrom('locked_group')
      .select(columns.lockedGroup)
      .where('userId', '=', userId)
      .where('name', '=', name)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(userId: string) {
    return this.db
      .selectFrom('locked_group')
      .select(columns.lockedGroup)
      .select(withAssetCount)
      .where('userId', '=', userId)
      .orderBy('name')
      .execute();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, name: DummyValue.STRING }] })
  create(group: Insertable<LockedGroupTable>) {
    return this.db.insertInto('locked_group').values(group).returning(columns.lockedGroup).executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { name: DummyValue.STRING }] })
  update(id: string, group: Updateable<LockedGroupTable>) {
    return this.db
      .updateTable('locked_group')
      .set(group)
      .where('id', '=', id)
      .returning(columns.lockedGroup)
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('locked_group').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async getAssetIds(lockedGroupId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    const rows = await this.db
      .selectFrom('locked_group_asset')
      .select('assetId')
      .where('lockedGroupId', '=', lockedGroupId)
      .where('assetId', 'in', [...assetIds])
      .execute();

    return new Set(rows.map(({ assetId }) => assetId));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID_SET] })
  @ChunkedSet({ paramIndex: 1 })
  async getLockedAssetIds(userId: string, assetIds: Set<string>): Promise<Set<string>> {
    if (assetIds.size === 0) {
      return new Set();
    }

    const rows = await this.db
      .selectFrom('asset')
      .select('id')
      .where('ownerId', '=', userId)
      .where('visibility', '=', AssetVisibility.Locked)
      .where('id', 'in', [...assetIds])
      .execute();

    return new Set(rows.map(({ id }) => id));
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @ChunkedArray({ paramIndex: 1 })
  async addAssetIds(lockedGroupId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.db
      .insertInto('locked_group_asset')
      .values(assetIds.map((assetId) => ({ lockedGroupId, assetId })))
      .onConflict((oc) => oc.doNothing())
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @ChunkedArray({ paramIndex: 1 })
  async removeAssetIds(lockedGroupId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.db
      .deleteFrom('locked_group_asset')
      .where('lockedGroupId', '=', lockedGroupId)
      .where('assetId', 'in', assetIds)
      .execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  async removeAssetsFromAll(assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.db.deleteFrom('locked_group_asset').where('assetId', 'in', assetIds).execute();
  }
}
