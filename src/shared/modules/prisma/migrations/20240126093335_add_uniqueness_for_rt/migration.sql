/*
  Warnings:

  - A unique constraint covering the columns `[rt]` on the table `RTSession` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RTSession_rt_key" ON "RTSession"("rt");
