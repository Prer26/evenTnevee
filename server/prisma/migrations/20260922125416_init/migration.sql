/*
  Warnings:

  - A unique constraint covering the columns `[user_id]` on the table `vendors` will be added. If there are existing duplicate values, this will fail.
  - Made the column `guest_count` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `paid_amount` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `commission_amount` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `commission_status` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `bookings` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `inquiries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `inquiries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `messages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `reviews` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `role` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `account_type` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email_verified` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `otp_attempts` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `failed_login_attempts` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lockout_until` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `token_version` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rating` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `reviews` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price_value` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `services` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `service_offerings` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `gallery` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contact` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `verified` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `is_available` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `match` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `blocked_dates` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `commission_rate` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `vendors` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_user_id_fkey";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "guest_count" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "paid_amount" SET NOT NULL,
ALTER COLUMN "commission_amount" SET NOT NULL,
ALTER COLUMN "commission_status" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "inquiries" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "messages" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "reviews" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL,
ALTER COLUMN "account_type" SET NOT NULL,
ALTER COLUMN "email_verified" SET NOT NULL,
ALTER COLUMN "otp_attempts" SET NOT NULL,
ALTER COLUMN "failed_login_attempts" SET NOT NULL,
ALTER COLUMN "lockout_until" SET NOT NULL,
ALTER COLUMN "token_version" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "vendors" ALTER COLUMN "rating" SET NOT NULL,
ALTER COLUMN "reviews" SET NOT NULL,
ALTER COLUMN "price_value" SET NOT NULL,
ALTER COLUMN "services" SET NOT NULL,
ALTER COLUMN "service_offerings" SET NOT NULL,
ALTER COLUMN "gallery" SET NOT NULL,
ALTER COLUMN "contact" SET NOT NULL,
ALTER COLUMN "verified" SET NOT NULL,
ALTER COLUMN "is_available" SET NOT NULL,
ALTER COLUMN "match" SET NOT NULL,
ALTER COLUMN "blocked_dates" SET NOT NULL,
ALTER COLUMN "commission_rate" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "vendors_user_id_key" ON "vendors"("user_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_bookings_status" RENAME TO "bookings_status_idx";

-- RenameIndex
ALTER INDEX "idx_bookings_user_id" RENAME TO "bookings_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_bookings_vendor_id" RENAME TO "bookings_vendor_id_idx";

-- RenameIndex
ALTER INDEX "idx_bookings_vendor_status" RENAME TO "bookings_vendor_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_inquiries_status" RENAME TO "inquiries_status_idx";

-- RenameIndex
ALTER INDEX "idx_messages_user_id" RENAME TO "messages_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_messages_vendor_id" RENAME TO "messages_vendor_id_idx";

-- RenameIndex
ALTER INDEX "idx_messages_vendor_user" RENAME TO "messages_vendor_id_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_reviews_vendor_id" RENAME TO "reviews_vendor_id_idx";

-- RenameIndex
ALTER INDEX "idx_transactions_status" RENAME TO "transactions_status_idx";

-- RenameIndex
ALTER INDEX "idx_transactions_user_id" RENAME TO "transactions_user_id_idx";

-- RenameIndex
ALTER INDEX "idx_transactions_user_status" RENAME TO "transactions_user_id_status_idx";

-- RenameIndex
ALTER INDEX "idx_users_email" RENAME TO "users_email_idx";

-- RenameIndex
ALTER INDEX "idx_vendors_category" RENAME TO "vendors_category_idx";

-- RenameIndex
ALTER INDEX "idx_vendors_city" RENAME TO "vendors_city_idx";

-- RenameIndex
ALTER INDEX "idx_vendors_is_available" RENAME TO "vendors_is_available_idx";

-- RenameIndex
ALTER INDEX "idx_vendors_rating" RENAME TO "vendors_rating_idx";
