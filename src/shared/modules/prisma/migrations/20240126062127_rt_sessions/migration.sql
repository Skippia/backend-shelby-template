-- CreateTable
CREATE TABLE "RTSession" (
    "id" SERIAL NOT NULL,
    "rt" TEXT NOT NULL,
    "rtExpDate" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "RTSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RTSession_rt_userId_key" ON "RTSession"("rt", "userId");

-- AddForeignKey
ALTER TABLE "RTSession" ADD CONSTRAINT "RTSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
