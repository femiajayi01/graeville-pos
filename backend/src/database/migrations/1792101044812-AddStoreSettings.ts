import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStoreSettings1792101044812 implements MigrationInterface {
  name = 'AddStoreSettings1792101044812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "store_settings" ("id" integer NOT NULL DEFAULT '1', "storeName" character varying(150) NOT NULL, "address" text NOT NULL DEFAULT '', "phone" character varying(100) NOT NULL DEFAULT '', "email" character varying(150) NOT NULL DEFAULT '', "receiptFooter" text NOT NULL DEFAULT '', "currency" character varying(3) NOT NULL DEFAULT 'NGN', "updatedBy" character varying(200), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_store_settings_single_row" CHECK ("id" = 1), CONSTRAINT "PK_4da44f346b360f378f1489b6199" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "store_settings"`);
  }
}
