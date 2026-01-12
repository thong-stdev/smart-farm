-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'DAILY_NOTIFICATION';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "keywords" TEXT[];

-- AlterTable
ALTER TABLE "UserSetting" ADD COLUMN     "enableNotifications" BOOLEAN NOT NULL DEFAULT true;
