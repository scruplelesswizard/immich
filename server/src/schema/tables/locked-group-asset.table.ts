import { CreateDateColumn, ForeignKeyColumn, type Generated, Table, Timestamp } from '@immich/sql-tools';
import { AssetTable } from 'src/schema/tables/asset.table.js';
import { LockedGroupTable } from 'src/schema/tables/locked-group.table.js';

@Table('locked_group_asset')
export class LockedGroupAssetTable {
  @ForeignKeyColumn(() => LockedGroupTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true, index: true })
  lockedGroupId!: string;

  @ForeignKeyColumn(() => AssetTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', primary: true, index: true })
  assetId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
