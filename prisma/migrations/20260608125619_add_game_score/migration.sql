-- CreateTable
CREATE TABLE "GameScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "totalPossible" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameScore_userId_idx" ON "GameScore"("userId");

-- CreateIndex
CREATE INDEX "GameScore_score_idx" ON "GameScore"("score");

-- AddForeignKey
ALTER TABLE "GameScore" ADD CONSTRAINT "GameScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
