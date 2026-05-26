-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('VIDEO', 'CSV');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "enhanceTitle" BOOLEAN NOT NULL DEFAULT false,
    "fileName" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "jobId" TEXT,
    "productTitle" TEXT,
    "description" TEXT,
    "brand" TEXT,
    "category" TEXT,
    "price" DOUBLE PRECISION,
    "mrp" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "productUrl" TEXT,
    "availability" TEXT,
    "color" TEXT,
    "size" TEXT,
    "material" TEXT,
    "enhancedTitle" TEXT,
    "qualityScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductIssue" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "message" TEXT NOT NULL,
    "suggestedFix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorPrice" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "productName" TEXT,
    "platform" TEXT NOT NULL,
    "competitorUrl" TEXT,
    "competitorPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "skuId" TEXT,
    "type" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_skuId_key" ON "Product"("skuId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIssue" ADD CONSTRAINT "ProductIssue_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Product"("skuId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorPrice" ADD CONSTRAINT "CompetitorPrice_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Product"("skuId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Product"("skuId") ON DELETE CASCADE ON UPDATE CASCADE;
