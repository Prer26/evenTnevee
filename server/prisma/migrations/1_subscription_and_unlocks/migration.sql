-- CreateTable
CREATE TABLE "subscriptions" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "plan" VARCHAR(50) NOT NULL DEFAULT 'FREE',
    "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quota" INTEGER NOT NULL DEFAULT 0,
    "used_unlocks" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMPTZ,
    "order_reference" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_unlocks" (
    "id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "vendor_id" VARCHAR(255) NOT NULL,
    "subscription_id" VARCHAR(255),
    "unlocked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "vendor_unlocks_user_id_idx" ON "vendor_unlocks"("user_id");

-- CreateIndex
CREATE INDEX "vendor_unlocks_vendor_id_idx" ON "vendor_unlocks"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_unlocks_user_id_vendor_id_key" ON "vendor_unlocks"("user_id", "vendor_id");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
