import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQueryIndexes1792614752893 implements MigrationInterface {
    name = 'AddQueryIndexes1792614752893'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "IDX_36729c112102eaddab92fa220d" ON "marketdata" ("instrumentId", "datetime", "id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ec4ef59f34b3232194b0a12456" ON "orders" ("userId", "datetime", "id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ec4ef59f34b3232194b0a12456"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_36729c112102eaddab92fa220d"
        `);
    }

}
