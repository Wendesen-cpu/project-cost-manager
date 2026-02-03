-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT 'System',
ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT 'Admin';
