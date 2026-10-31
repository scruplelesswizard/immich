import {
  Column,
  CreateDateColumn,
  ForeignKeyColumn,
  type Generated,
  PrimaryGeneratedColumn,
  Table,
  Timestamp,
  Unique,
  UpdateDateColumn,
} from '@immich/sql-tools';
import { UpdateIdColumn, UpdatedAtTrigger } from 'src/decorators.js';
import { UserTable } from 'src/schema/tables/user.table.js';

@Table('locked_group')
@UpdatedAtTrigger('locked_group_updatedAt')
@Unique({ columns: ['userId', 'name'] })
export class LockedGroupTable {
  @PrimaryGeneratedColumn()
  id!: Generated<string>;

  @ForeignKeyColumn(() => UserTable, { onUpdate: 'CASCADE', onDelete: 'CASCADE', index: false })
  userId!: string;

  @Column()
  name!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;

  @UpdateDateColumn()
  updatedAt!: Generated<Timestamp>;

  @UpdateIdColumn({ index: true })
  updateId!: Generated<string>;
}
