import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1792591104074 implements MigrationInterface {
    name = 'InitialMigration1792591104074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "marketdata" DROP CONSTRAINT "marketdata_instrumentId_fkey"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "orders_instrumentId_fkey"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey"
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "email"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "accountNumber"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "instruments"
            ALTER COLUMN "ticker"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "instruments"
            ALTER COLUMN "name"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "instruments"
            ALTER COLUMN "type"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ALTER COLUMN "instrumentId"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ALTER COLUMN "close"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ALTER COLUMN "previousClose"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ALTER COLUMN "datetime"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "userId"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "instrumentId"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "side"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "type"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "size"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "datetime"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ADD CONSTRAINT "FK_51062f17de5aa25b838ca950197" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_f4eda5f59199007d1001a99d341" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            CREATE VIEW "instrument_quotes" AS
            SELECT DISTINCT ON ("i"."id") "i"."id" AS "id",
                "i"."ticker" AS "ticker",
                "i"."name" AS "name",
                "i"."type" AS "type",
                "m"."close" AS "close",
                "m"."previousClose" AS "previousClose",
                "m"."datetime" AS "asOf"
            FROM "instruments" "i"
                LEFT JOIN "marketdata" "m" ON "m"."instrumentId" = "i"."id"
            ORDER BY "i"."id" ASC,
                "m"."datetime" DESC,
                "m"."id" DESC
        `);
        await queryRunner.query(`
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)
        `, ["public","VIEW","instrument_quotes","SELECT DISTINCT ON (\"i\".\"id\") \"i\".\"id\" AS \"id\", \"i\".\"ticker\" AS \"ticker\", \"i\".\"name\" AS \"name\", \"i\".\"type\" AS \"type\", \"m\".\"close\" AS \"close\", \"m\".\"previousClose\" AS \"previousClose\", \"m\".\"datetime\" AS \"asOf\" FROM \"instruments\" \"i\" LEFT JOIN \"marketdata\" \"m\" ON \"m\".\"instrumentId\" = \"i\".\"id\" ORDER BY \"i\".\"id\" ASC, \"m\".\"datetime\" DESC, \"m\".\"id\" DESC"]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "typeorm_metadata"
            WHERE "type" = $1
                AND "name" = $2
                AND "schema" = $3
        `, ["VIEW","instrument_quotes","public"]);
        await queryRunner.query(`
            DROP VIEW "instrument_quotes"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_f4eda5f59199007d1001a99d341"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders" DROP CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1"
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata" DROP CONSTRAINT "FK_51062f17de5aa25b838ca950197"
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "datetime" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "size" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "status" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "type" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "side" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "instrumentId" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "userId" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ALTER COLUMN "datetime" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ALTER COLUMN "previousClose" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ALTER COLUMN "close" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ALTER COLUMN "instrumentId" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "instruments"
            ALTER COLUMN "type" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "instruments"
            ALTER COLUMN "name" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "instruments"
            ALTER COLUMN "ticker" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "accountNumber" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "users"
            ALTER COLUMN "email" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "orders_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "marketdata"
            ADD CONSTRAINT "marketdata_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

}
