-- CreateTable
CREATE TABLE "ConnectionScore" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "chainLength" INTEGER NOT NULL,
    "shortestPossible" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL,
    "timeSeconds" INTEGER NOT NULL,
    "playerA" TEXT NOT NULL,
    "playerB" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConnectionScore_userId_idx" ON "ConnectionScore"("userId");

-- CreateIndex
CREATE INDEX "ConnectionScore_score_idx" ON "ConnectionScore"("score");

-- AddForeignKey
ALTER TABLE "ConnectionScore" ADD CONSTRAINT "ConnectionScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
