import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE TABLE "locked_group" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "userId" uuid NOT NULL,
  "name" character varying NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updateId" uuid NOT NULL DEFAULT immich_uuid_v7(),
  CONSTRAINT "locked_group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "locked_group_userId_name_uq" UNIQUE ("userId", "name"),
  CONSTRAINT "locked_group_pkey" PRIMARY KEY ("id")
);`.execute(db);
  await sql`CREATE INDEX "locked_group_updateId_idx" ON "locked_group" ("updateId");`.execute(db);
  await sql`CREATE OR REPLACE TRIGGER "locked_group_updatedAt"
  BEFORE UPDATE ON "locked_group"
  FOR EACH ROW
  EXECUTE FUNCTION updated_at();`.execute(db);
  await sql`CREATE TABLE "locked_group_asset" (
  "lockedGroupId" uuid NOT NULL,
  "assetId" uuid NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "locked_group_asset_lockedGroupId_fkey" FOREIGN KEY ("lockedGroupId") REFERENCES "locked_group" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "locked_group_asset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset" ("id") ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "locked_group_asset_pkey" PRIMARY KEY ("lockedGroupId", "assetId")
);`.execute(db);
  await sql`CREATE INDEX "locked_group_asset_lockedGroupId_idx" ON "locked_group_asset" ("lockedGroupId");`.execute(db);
  await sql`CREATE INDEX "locked_group_asset_assetId_idx" ON "locked_group_asset" ("assetId");`.execute(db);
  await sql`INSERT INTO "migration_overrides" ("name", "value") VALUES ('trigger_locked_group_updatedAt', '{"type":"trigger","name":"locked_group_updatedAt","sql":"CREATE OR REPLACE TRIGGER \\"locked_group_updatedAt\\"\\n  BEFORE UPDATE ON \\"locked_group\\"\\n  FOR EACH ROW\\n  EXECUTE FUNCTION updated_at();"}'::jsonb);`.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP TABLE "locked_group_asset";`.execute(db);
  await sql`DROP TABLE "locked_group";`.execute(db);
  await sql`DROP TRIGGER "locked_group_updatedAt" ON "locked_group";`.execute(db);
  await sql`DELETE FROM "migration_overrides" WHERE "name" = 'trigger_locked_group_updatedAt';`.execute(db);
}
