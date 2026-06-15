-- CreateTable
CREATE TABLE "MatchGoal" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "isOwnGoal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MatchGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchGoal_matchId_idx" ON "MatchGoal"("matchId");

-- CreateIndex
CREATE INDEX "MatchGoal_playerName_idx" ON "MatchGoal"("playerName");

-- AddForeignKey
ALTER TABLE "MatchGoal" ADD CONSTRAINT "MatchGoal_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
