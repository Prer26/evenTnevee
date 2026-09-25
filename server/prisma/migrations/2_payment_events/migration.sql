-- CreateTable
CREATE TABLE "payment_events" (
    "id" VARCHAR(255) NOT NULL,
    "event_id" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "order_id" VARCHAR(255),
    "payment_id" VARCHAR(255),
    "user_id" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'processed',
    "payload" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_event_id_key" ON "payment_events"("event_id");

-- CreateIndex
CREATE INDEX "payment_events_order_id_idx" ON "payment_events"("order_id");

-- CreateIndex
CREATE INDEX "payment_events_payment_id_idx" ON "payment_events"("payment_id");

-- CreateIndex
CREATE INDEX "payment_events_user_id_idx" ON "payment_events"("user_id");
