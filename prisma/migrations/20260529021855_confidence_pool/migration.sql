-- CreateTable
CREATE TABLE "CardTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "cooldownHours" INTEGER NOT NULL DEFAULT 0,
    "multiplier" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardTemplateId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "UserCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChipBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 500,
    "lifetimeEarnings" INTEGER NOT NULL DEFAULT 0,
    "dailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyAt" TIMESTAMP(3),

    CONSTRAINT "ChipBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "scoreA" INTEGER NOT NULL,
    "scoreB" INTEGER NOT NULL,
    "wagerAmount" INTEGER NOT NULL,
    "oddsMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "payout" INTEGER,
    "cardId" TEXT,

    CONSTRAINT "Bet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCard_userId_cardTemplateId_key" ON "UserCard"("userId", "cardTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "ChipBalance_userId_key" ON "ChipBalance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bet_userId_matchId_key" ON "Bet"("userId", "matchId");

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCard" ADD CONSTRAINT "UserCard_cardTemplateId_fkey" FOREIGN KEY ("cardTemplateId") REFERENCES "CardTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChipBalance" ADD CONSTRAINT "ChipBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
