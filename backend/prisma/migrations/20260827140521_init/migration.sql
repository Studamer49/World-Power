-- CreateTable
CREATE TABLE "GameConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "gameDay" INTEGER NOT NULL DEFAULT 1,
    "gameDate" TEXT NOT NULL DEFAULT '14 August 2026',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "playerName" TEXT NOT NULL DEFAULT '',
    "leaderName" TEXT NOT NULL DEFAULT '',
    "governmentName" TEXT NOT NULL DEFAULT '',
    "flag" TEXT NOT NULL DEFAULT '',
    "alive" BOOLEAN NOT NULL DEFAULT true,
    "dateCreated" TEXT NOT NULL DEFAULT '',
    "money" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "mp" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "gdp" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "dailyIncome" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "dailyMP" DOUBLE PRECISION NOT NULL DEFAULT 300,
    "researchTier" INTEGER NOT NULL DEFAULT 1,
    "investmentGDP" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "manualOverrides" TEXT NOT NULL DEFAULT '{}',
    "completedResearch" TEXT NOT NULL DEFAULT '[]',
    "unitInventory" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Territory" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "capturingCountryId" TEXT NOT NULL,
    "capturedOnDay" INTEGER NOT NULL,
    "capturedOnDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'occupied',
    "moneyIncome" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Territory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TerritoryCaptureHistory" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "territoriesData" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TerritoryCaptureHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Battle" (
    "id" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL DEFAULT 'default',
    "warId" TEXT,
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "attackerId" TEXT NOT NULL,
    "defenderId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "attackerUnitsData" TEXT NOT NULL DEFAULT '[]',
    "defenderUnitsData" TEXT NOT NULL DEFAULT '[]',
    "attackerMP" DOUBLE PRECISION NOT NULL,
    "defenderMP" DOUBLE PRECISION NOT NULL,
    "attackerEffectivePower" DOUBLE PRECISION NOT NULL,
    "defenderEffectivePower" DOUBLE PRECISION NOT NULL,
    "winner" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "mpLostAttacker" DOUBLE PRECISION NOT NULL,
    "mpLostDefender" DOUBLE PRECISION NOT NULL,
    "territoryCaptured" BOOLEAN NOT NULL DEFAULT false,
    "territoryName" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Battle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "War" (
    "id" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "attackerIds" TEXT NOT NULL DEFAULT '[]',
    "defenderIds" TEXT NOT NULL DEFAULT '[]',
    "startDate" TEXT NOT NULL,
    "startDay" INTEGER NOT NULL,
    "endDate" TEXT NOT NULL DEFAULT '',
    "endDay" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "battles" TEXT NOT NULL DEFAULT '[]',
    "territoriesCaptured" TEXT NOT NULL DEFAULT '[]',
    "territoriesLost" TEXT NOT NULL DEFAULT '[]',
    "warScore" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "War_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarScoreEvent" (
    "id" TEXT NOT NULL,
    "warId" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL DEFAULT 'default',
    "countryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarScoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL DEFAULT 'default',
    "countryId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyChange" (
    "id" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL DEFAULT 'default',
    "countryId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "from" TEXT NOT NULL DEFAULT '',
    "to" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MoneyChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MPChange" (
    "id" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL DEFAULT 'default',
    "countryId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MPChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treaty" (
    "id" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL DEFAULT 'default',
    "name" TEXT NOT NULL,
    "countryIds" TEXT NOT NULL DEFAULT '[]',
    "territoryId" TEXT NOT NULL,
    "territoryOwnerId" TEXT NOT NULL,
    "splits" TEXT NOT NULL DEFAULT '[]',
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treaty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySnapshot" (
    "id" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL DEFAULT 'default',
    "gameDay" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilitaryConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "unitConfigs" TEXT NOT NULL DEFAULT '{}',
    "matchups" TEXT NOT NULL DEFAULT '[]',
    "tierResearchRequirements" TEXT NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilitaryConfig_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Country" ADD CONSTRAINT "Country_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TerritoryCaptureHistory" ADD CONSTRAINT "TerritoryCaptureHistory_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_attackerId_fkey" FOREIGN KEY ("attackerId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_defenderId_fkey" FOREIGN KEY ("defenderId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "War" ADD CONSTRAINT "War_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarScoreEvent" ADD CONSTRAINT "WarScoreEvent_warId_fkey" FOREIGN KEY ("warId") REFERENCES "War"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarScoreEvent" ADD CONSTRAINT "WarScoreEvent_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyChange" ADD CONSTRAINT "MoneyChange_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyChange" ADD CONSTRAINT "MoneyChange_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MPChange" ADD CONSTRAINT "MPChange_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MPChange" ADD CONSTRAINT "MPChange_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treaty" ADD CONSTRAINT "Treaty_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySnapshot" ADD CONSTRAINT "DailySnapshot_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
