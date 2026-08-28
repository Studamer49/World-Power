-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "password" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "author" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isGM" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "replyToId" TEXT;

-- CreateTable
CREATE TABLE "GameState" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "data" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameState_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
