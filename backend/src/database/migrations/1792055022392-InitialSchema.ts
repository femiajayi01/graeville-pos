import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1792055022392 implements MigrationInterface {
  name = 'InitialSchema1792055022392';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced" boolean NOT NULL DEFAULT false, "name" character varying(150) NOT NULL, "categoryNo" character varying(20) NOT NULL, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "UQ_07295faf614b84ddc86c16afd82" UNIQUE ("categoryNo"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b8d8bba5f416c6842219217d81" ON "categories"  ("synced") `,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced" boolean NOT NULL DEFAULT false, "name" character varying(200) NOT NULL, "barcode" character varying(100) NOT NULL, "costPrice" numeric(12,2) NOT NULL DEFAULT '0', "sellingPrice" numeric(12,2) NOT NULL DEFAULT '0', "quantity" integer NOT NULL DEFAULT '0', "description" text, "brandId" integer, "categoryId" integer, CONSTRAINT "UQ_4c9fb58de893725258746385e16" UNIQUE ("name"), CONSTRAINT "UQ_adfc522baf9d9b19cd7d9461b7e" UNIQUE ("barcode"), CONSTRAINT "CHK_products_quantity_non_negative" CHECK ("quantity" >= 0), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_303b4acdedf4f4ebef86dd47b7" ON "products"  ("synced") `,
    );
    await queryRunner.query(
      `CREATE TABLE "brands" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced" boolean NOT NULL DEFAULT false, "name" character varying(150) NOT NULL, "brandNo" character varying(20) NOT NULL, CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name"), CONSTRAINT "UQ_b486c2043d3300bb9f5288bf695" UNIQUE ("brandNo"), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c838c2f04b3a5125bcda9d125" ON "brands"  ("synced") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role" AS ENUM('User', 'Admin', 'Super Admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced" boolean NOT NULL DEFAULT false, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "password" character varying(255) NOT NULL, "role" "public"."user_role" NOT NULL DEFAULT 'User', "registeredBy" character varying(200) NOT NULL DEFAULT 'system', CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b82de06e75580b5a3a84c1cadb" ON "users"  ("synced") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "orderId" integer NOT NULL, "productId" integer, "productName" character varying(200) NOT NULL, "barcode" character varying(100), "unitPrice" numeric(12,2) NOT NULL, "quantity" integer NOT NULL, "subtotal" numeric(12,2) NOT NULL, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f1d359a55923bb45b057fbdab0" ON "order_items"  ("orderId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_type" AS ENUM('Cash', 'Debit Card', 'Transfer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced" boolean NOT NULL DEFAULT false, "orderNumber" character varying(30) NOT NULL, "salespersonId" integer, "salesperson" character varying(200) NOT NULL, "customerId" integer, "customerName" character varying(200), "quantity" integer NOT NULL, "totalPrice" numeric(12,2) NOT NULL, "discount" numeric(12,2) NOT NULL DEFAULT '0', "amountPaid" numeric(12,2) NOT NULL, "paymentType" "public"."payment_type" NOT NULL, "terminal" character varying(100), "isReturned" boolean NOT NULL DEFAULT false, "returnedAt" TIMESTAMP WITH TIME ZONE, "returnedBy" character varying(200), CONSTRAINT "UQ_59b0c3b34ea0fa5562342f24143" UNIQUE ("orderNumber"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dc0697c426724913fcbd27d72e" ON "orders"  ("synced") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cfbaa9433bd3c6123c235e8a20" ON "orders"  ("salesperson") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ba06a446654224dfd0e696f86" ON "orders"  ("isReturned") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_orders_createdAt" ON "orders"  ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customers" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "synced" boolean NOT NULL DEFAULT false, "fullName" character varying(200) NOT NULL, "email" character varying(150), "phoneNo" character varying(30) NOT NULL, "address" text, "birthdate" date, "registeredBy" character varying(200) NOT NULL DEFAULT 'system', CONSTRAINT "UQ_eb0e4a32ddb69b0af4322d0fbaa" UNIQUE ("phoneNo"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5fb09d81eead6b9b45cb45c6ce" ON "customers"  ("synced") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1ebd98560ecd1f302d80cfcae8" ON "customers"  ("fullName") `,
    );
    await queryRunner.query(
      `CREATE TABLE "packings" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "items" jsonb NOT NULL, "totalQty" integer NOT NULL, "totalPrice" numeric(12,2) NOT NULL, "terminal" character varying(100) NOT NULL, "parkedById" integer, "parkedBy" character varying(200) NOT NULL, "label" character varying(200), CONSTRAINT "PK_fb427ed4d85f84f8f62fd249bd6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6285bf5f0ce6e43370f034631" ON "packings"  ("terminal") `,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_cdb99c05982d5191ac8465ac010" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_b24e518c1ec563d04143748e15f" FOREIGN KEY ("salespersonId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_e5de51ca888d8b1f5ac25799dd1" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_e5de51ca888d8b1f5ac25799dd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_b24e518c1ec563d04143748e15f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_cdb99c05982d5191ac8465ac010"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_ff56834e735fa78a15d0cf21926"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_ea86d0c514c4ecbb5694cbf57df"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a6285bf5f0ce6e43370f034631"`,
    );
    await queryRunner.query(`DROP TABLE "packings"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1ebd98560ecd1f302d80cfcae8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5fb09d81eead6b9b45cb45c6ce"`,
    );
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_orders_createdAt"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ba06a446654224dfd0e696f86"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfbaa9433bd3c6123c235e8a20"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dc0697c426724913fcbd27d72e"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."payment_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f1d359a55923bb45b057fbdab0"`,
    );
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b82de06e75580b5a3a84c1cadb"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."user_role"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4c838c2f04b3a5125bcda9d125"`,
    );
    await queryRunner.query(`DROP TABLE "brands"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_303b4acdedf4f4ebef86dd47b7"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b8d8bba5f416c6842219217d81"`,
    );
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
