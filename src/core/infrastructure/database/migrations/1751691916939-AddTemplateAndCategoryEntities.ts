import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTemplateAndCategoryEntities1751691916939 implements MigrationInterface {
    name = 'AddTemplateAndCategoryEntities1751691916939'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."organizations_plan_enum" AS ENUM('free', 'starter', 'pro', 'enterprise')`);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "logo" character varying, "website" character varying, "plan" "public"."organizations_plan_enum" NOT NULL DEFAULT 'free', "planLimits" json, "customSettings" json, "isActive" boolean NOT NULL DEFAULT true, "stripeCustomerId" character varying, "stripeSubscriptionId" character varying, "trialEndsAt" TIMESTAMP, "currentMonthExecutions" integer NOT NULL DEFAULT '0', "executionResetDate" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."organization_members_role_enum" AS ENUM('owner', 'admin', 'member', 'guest')`);
        await queryRunner.query(`CREATE TABLE "organization_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "userId" uuid NOT NULL, "role" "public"."organization_members_role_enum" NOT NULL DEFAULT 'member', "invitedBy" character varying, "inviteToken" character varying, "inviteExpiresAt" TIMESTAMP, "inviteAccepted" boolean NOT NULL DEFAULT false, "acceptedAt" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "lastActiveAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7c48546e8026fb043d9ad0c2c8c" UNIQUE ("organizationId", "userId"), CONSTRAINT "PK_c2b39d5d072886a4d9c8105eb9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "template_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "icon" character varying, "color" character varying, "displayOrder" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "parentId" uuid, CONSTRAINT "UQ_7bb63d4121637df0ddb2e14f225" UNIQUE ("slug"), CONSTRAINT "PK_ddd88953a0cd7ee62295a90f984" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "template_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "rating" integer NOT NULL, "comment" text, "isVerifiedPurchase" boolean NOT NULL DEFAULT false, "helpfulCount" integer NOT NULL DEFAULT '0', "unhelpfulCount" integer NOT NULL DEFAULT '0', "isVisible" boolean NOT NULL DEFAULT true, "moderatedAt" TIMESTAMP, "moderationNote" text, "templateId" uuid, "reviewerId" uuid, "moderatedById" uuid, CONSTRAINT "UQ_03cd988a2137c8856d07252a64e" UNIQUE ("templateId", "reviewerId"), CONSTRAINT "PK_aefb1377886b5ecda896b2c8dab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3a0dff1be3d7c492e55dbb568b" ON "template_reviews" ("rating") `);
        await queryRunner.query(`CREATE INDEX "IDX_97ebd4735fbc7445e738cabc89" ON "template_reviews" ("templateId", "createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."workflow_templates_status_enum" AS ENUM('draft', 'pending_review', 'approved', 'rejected', 'archived')`);
        await queryRunner.query(`CREATE TYPE "public"."workflow_templates_visibility_enum" AS ENUM('private', 'organization', 'public', 'marketplace')`);
        await queryRunner.query(`CREATE TYPE "public"."workflow_templates_tier_enum" AS ENUM('free', 'premium', 'enterprise')`);
        await queryRunner.query(`CREATE TABLE "workflow_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text NOT NULL, "longDescription" text, "workflowDefinition" json NOT NULL, "requiredCredentials" json, "variables" json, "status" "public"."workflow_templates_status_enum" NOT NULL DEFAULT 'draft', "visibility" "public"."workflow_templates_visibility_enum" NOT NULL DEFAULT 'private', "tier" "public"."workflow_templates_tier_enum" NOT NULL DEFAULT 'free', "price" numeric(10,2) NOT NULL DEFAULT '0', "iconUrl" character varying, "previewUrl" character varying, "screenshots" json, "tags" json NOT NULL, "metadata" json, "usageCount" integer NOT NULL DEFAULT '0', "downloadCount" integer NOT NULL DEFAULT '0', "viewCount" integer NOT NULL DEFAULT '0', "averageRating" double precision NOT NULL DEFAULT '0', "reviewCount" integer NOT NULL DEFAULT '0', "isFeatured" boolean NOT NULL DEFAULT false, "isOfficial" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "rejectionReason" character varying, "publishedAt" TIMESTAMP, "creatorId" uuid NOT NULL, "organizationId" uuid, CONSTRAINT "UQ_82ba6eead66300f1cf290e277fe" UNIQUE ("slug"), CONSTRAINT "PK_de336a1fce23ad3261d49423eae" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "template_categories_mapping" ("templateId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_7dceabb8549057f037810f5e1da" PRIMARY KEY ("templateId", "categoryId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0f5cb0c57b146ef279e9cf29b4" ON "template_categories_mapping" ("templateId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ce245ae45dbaa4eace64e05112" ON "template_categories_mapping" ("categoryId") `);
        await queryRunner.query(`CREATE TABLE "template_categories_closure" ("id_ancestor" uuid NOT NULL, "id_descendant" uuid NOT NULL, CONSTRAINT "PK_fa98db63a8d4c350c10f97df5e1" PRIMARY KEY ("id_ancestor", "id_descendant"))`);
        await queryRunner.query(`CREATE INDEX "IDX_40b4ef51fc86d15b689379150a" ON "template_categories_closure" ("id_ancestor") `);
        await queryRunner.query(`CREATE INDEX "IDX_254707fce4f5c52b01440b3af3" ON "template_categories_closure" ("id_descendant") `);
        // Add columns as nullable first
        await queryRunner.query(`ALTER TABLE "credentials" ADD "organizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "credentials" ADD "sharing" json`);
        await queryRunner.query(`ALTER TABLE "users" ADD "currentOrganizationId" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profilePicture" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "timezone" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "preferences" json`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD "organizationId" uuid`);
        
        // Create a default organization for existing data
        await queryRunner.query(`INSERT INTO "organizations" ("id", "slug", "name", "description") VALUES (uuid_generate_v4(), 'default-org', 'Default Organization', 'Default organization for existing users')`);
        
        // Get the default organization id
        const defaultOrg = await queryRunner.query(`SELECT id FROM "organizations" WHERE slug = 'default-org' LIMIT 1`);
        const defaultOrgId = defaultOrg[0].id;
        
        // Update existing records with the default organization
        await queryRunner.query(`UPDATE "credentials" SET "organizationId" = $1 WHERE "organizationId" IS NULL`, [defaultOrgId]);
        await queryRunner.query(`UPDATE "workflows" SET "organizationId" = $1 WHERE "organizationId" IS NULL`, [defaultOrgId]);
        
        // Add all existing users to the default organization as owners
        await queryRunner.query(`
            INSERT INTO "organization_members" ("organizationId", "userId", "role", "inviteAccepted")
            SELECT $1, id, 'owner', true FROM "users"
        `, [defaultOrgId]);
        
        // Set the default organization as current for all users
        await queryRunner.query(`UPDATE "users" SET "currentOrganizationId" = $1`, [defaultOrgId]);
        
        // Now make the columns NOT NULL
        await queryRunner.query(`ALTER TABLE "credentials" ALTER COLUMN "organizationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "workflows" ALTER COLUMN "organizationId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD "sharing" json`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD "tags" json`);
        await queryRunner.query(`ALTER TABLE "credentials" ADD CONSTRAINT "FK_693d053d2009de2741907423e18" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD CONSTRAINT "FK_e826222ad017663c6db1a45a4f1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_d9cefcee01b771dd297c4d383cf" FOREIGN KEY ("currentOrganizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workflows" ADD CONSTRAINT "FK_e5b97c3123140983764e48265f8" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_categories" ADD CONSTRAINT "FK_5a2efb45db330e39fedb91b33a3" FOREIGN KEY ("parentId") REFERENCES "template_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_reviews" ADD CONSTRAINT "FK_b428241a0e53c9c39c9283dd1e7" FOREIGN KEY ("templateId") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_reviews" ADD CONSTRAINT "FK_236b5acdcea32e5c9314b69d744" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_reviews" ADD CONSTRAINT "FK_ac1272f5cd8d2d1b4007810107f" FOREIGN KEY ("moderatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workflow_templates" ADD CONSTRAINT "FK_55aa996e03a343601b90c72a1f3" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workflow_templates" ADD CONSTRAINT "FK_832e303ee037faf1221334f8787" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_categories_mapping" ADD CONSTRAINT "FK_0f5cb0c57b146ef279e9cf29b40" FOREIGN KEY ("templateId") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "template_categories_mapping" ADD CONSTRAINT "FK_ce245ae45dbaa4eace64e051127" FOREIGN KEY ("categoryId") REFERENCES "template_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_categories_closure" ADD CONSTRAINT "FK_40b4ef51fc86d15b689379150a3" FOREIGN KEY ("id_ancestor") REFERENCES "template_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template_categories_closure" ADD CONSTRAINT "FK_254707fce4f5c52b01440b3af3b" FOREIGN KEY ("id_descendant") REFERENCES "template_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template_categories_closure" DROP CONSTRAINT "FK_254707fce4f5c52b01440b3af3b"`);
        await queryRunner.query(`ALTER TABLE "template_categories_closure" DROP CONSTRAINT "FK_40b4ef51fc86d15b689379150a3"`);
        await queryRunner.query(`ALTER TABLE "template_categories_mapping" DROP CONSTRAINT "FK_ce245ae45dbaa4eace64e051127"`);
        await queryRunner.query(`ALTER TABLE "template_categories_mapping" DROP CONSTRAINT "FK_0f5cb0c57b146ef279e9cf29b40"`);
        await queryRunner.query(`ALTER TABLE "workflow_templates" DROP CONSTRAINT "FK_832e303ee037faf1221334f8787"`);
        await queryRunner.query(`ALTER TABLE "workflow_templates" DROP CONSTRAINT "FK_55aa996e03a343601b90c72a1f3"`);
        await queryRunner.query(`ALTER TABLE "template_reviews" DROP CONSTRAINT "FK_ac1272f5cd8d2d1b4007810107f"`);
        await queryRunner.query(`ALTER TABLE "template_reviews" DROP CONSTRAINT "FK_236b5acdcea32e5c9314b69d744"`);
        await queryRunner.query(`ALTER TABLE "template_reviews" DROP CONSTRAINT "FK_b428241a0e53c9c39c9283dd1e7"`);
        await queryRunner.query(`ALTER TABLE "template_categories" DROP CONSTRAINT "FK_5a2efb45db330e39fedb91b33a3"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP CONSTRAINT "FK_e5b97c3123140983764e48265f8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_d9cefcee01b771dd297c4d383cf"`);
        await queryRunner.query(`ALTER TABLE "organization_members" DROP CONSTRAINT "FK_e826222ad017663c6db1a45a4f1"`);
        await queryRunner.query(`ALTER TABLE "organization_members" DROP CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f"`);
        await queryRunner.query(`ALTER TABLE "credentials" DROP CONSTRAINT "FK_693d053d2009de2741907423e18"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "sharing"`);
        await queryRunner.query(`ALTER TABLE "workflows" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "preferences"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "timezone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profilePicture"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "currentOrganizationId"`);
        await queryRunner.query(`ALTER TABLE "credentials" DROP COLUMN "sharing"`);
        await queryRunner.query(`ALTER TABLE "credentials" DROP COLUMN "organizationId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_254707fce4f5c52b01440b3af3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_40b4ef51fc86d15b689379150a"`);
        await queryRunner.query(`DROP TABLE "template_categories_closure"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ce245ae45dbaa4eace64e05112"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0f5cb0c57b146ef279e9cf29b4"`);
        await queryRunner.query(`DROP TABLE "template_categories_mapping"`);
        await queryRunner.query(`DROP TABLE "workflow_templates"`);
        await queryRunner.query(`DROP TYPE "public"."workflow_templates_tier_enum"`);
        await queryRunner.query(`DROP TYPE "public"."workflow_templates_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."workflow_templates_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97ebd4735fbc7445e738cabc89"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a0dff1be3d7c492e55dbb568b"`);
        await queryRunner.query(`DROP TABLE "template_reviews"`);
        await queryRunner.query(`DROP TABLE "template_categories"`);
        await queryRunner.query(`DROP TABLE "organization_members"`);
        await queryRunner.query(`DROP TYPE "public"."organization_members_role_enum"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TYPE "public"."organizations_plan_enum"`);
    }

}
