import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../auth.js";
import { logApiError } from "../logger.js";
import {
  validateBody,
  validateQuery,
  shortText,
  optionalText,
  money,
  isoDateString,
  listQuery,
} from "../validate.js";

const router = Router();

const STATUSES = ["Pending", "Overdue", "Cleared"];

/* =========================================================
   CREATE TRANSACTION SCHEMA
   ========================================================= */

const createSchema = z
  .object({
    vendor: optionalText(200),

    amount: money.refine(
      (value) => value > 0,
      "Amount must be greater than 0"
    ),

    status: z
      .enum(STATUSES)
      .default("Pending"),

    category: optionalText(100),

    description: optionalText(1000),

    notes: optionalText(1000),

    date: isoDateString.optional(),

    created_date: isoDateString.optional(),

    invoice_number: optionalText(100),

    method: optionalText(50),

    payment_method: optionalText(50),

    type: optionalText(50),

    event_name: optionalText(200),

    priority: optionalText(50),

    amount_display: optionalText(50),

    due_date: isoDateString.optional(),
  })
  .strict();

/* =========================================================
   PATCH SCHEMA
   ========================================================= */

const patchSchema = z
  .object({
    vendor: shortText(200).optional(),

    amount: money.optional(),

    status: z
      .enum(STATUSES)
      .optional(),

    category: optionalText(100),

    description: optionalText(1000),

    invoice: optionalText(100),

    invoice_number: optionalText(100),

    notes: optionalText(1000),

    date: isoDateString.optional(),

    method: optionalText(50),

    payment_method: optionalText(50),

    type: optionalText(50),

    due_date: isoDateString.optional(),

    razorpay_order_id:
      shortText(200).optional(),

    razorpay_payment_id:
      shortText(200).optional(),
  })
  .strict();

/* =========================================================
   FORMAT TRANSACTION
   ========================================================= */

const formatTransaction = (transaction) => {
  if (!transaction) {
    return null;
  }

  return {
    id: transaction.id,

    user_id: transaction.userId,

    vendor_id: transaction.vendorId,

    vendor: transaction.vendor,

    amount: transaction.amount
      ? Number(transaction.amount)
      : 0,

    type: transaction.type,

    category: transaction.category,

    description:
      transaction.description,

    notes: transaction.notes,

    date: transaction.date,

    due_date: transaction.dueDate,

    status: transaction.status,

    invoice: transaction.invoice,

    method: transaction.method,

    razorpay_order_id:
      transaction.razorpayOrderId,

    razorpay_payment_id:
      transaction.razorpayPaymentId,

    created_at:
      transaction.createdAt,

    created_date:
      transaction.createdAt,
  };
};

/* =========================================================
   SORTING
   ========================================================= */

const SORT_FIELD_MAP = {
  created_date: "createdAt",
  amount: "amount",
  status: "status",
  due_date: "dueDate",
};

/* =========================================================
   GET ALL TRANSACTIONS
   GET /api/transactions
   ========================================================= */

router.get(
  "/",
  requireAuth,
  validateQuery(
    listQuery([
      "created_date",
      "amount",
      "status",
      "due_date",
    ])
  ),
  async (req, res) => {
    try {
      const { sort, limit } = req.query;

      const limitVal =
        parseInt(limit, 10) || 100;

      let orderBy = {
        createdAt: "desc",
      };

      if (sort) {
        const isDesc =
          sort.startsWith("-");

        const field = isDesc
          ? sort.slice(1)
          : sort;

        const prismaField =
          SORT_FIELD_MAP[field];

        if (prismaField) {
          orderBy = {
            [prismaField]: isDesc
              ? "desc"
              : "asc",
          };
        }
      }

      let transactions;

      if (req.auth.role === "admin") {
        transactions =
          await prisma.transaction.findMany({
            orderBy,
            take: limitVal,
          });
      } else {
        transactions =
          await prisma.transaction.findMany({
            where: {
              userId: req.auth.sub,
            },
            orderBy,
            take: limitVal,
          });
      }

      res.json(
        transactions.map(
          formatTransaction
        )
      );
    } catch (error) {
      logApiError(error, req);

      res.status(500).json({
        message:
          "Failed to fetch transactions",
      });
    }
  }
);

/* =========================================================
   GET SINGLE TRANSACTION
   GET /api/transactions/:id
   ========================================================= */

router.get(
  "/:id",
  requireAuth,
  async (req, res) => {
    try {
      const transaction =
        await prisma.transaction.findUnique({
          where: {
            id: req.params.id,
          },
        });

      if (!transaction) {
        return res.status(404).json({
          message:
            "Transaction not found",
        });
      }

      const isOwner =
        transaction.userId ===
        req.auth.sub;

      const isAdmin =
        req.auth.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          message: "Not allowed",
        });
      }

      res.json(
        formatTransaction(transaction)
      );
    } catch (error) {
      logApiError(error, req);

      res.status(500).json({
        message:
          "Failed to fetch transaction",
      });
    }
  }
);

/* =========================================================
   CREATE TRANSACTION / ADD EXPENSE
   POST /api/transactions
   ========================================================= */

router.post(
  "/",
  requireAuth,
  validateBody(createSchema),
  async (req, res) => {
    try {
      const {
        vendor,
        amount,
        status,
        category,
        description,
        notes,
        date,
        invoice_number,
        method,
        payment_method,
        type,
        due_date,
      } = req.body;

      /* -----------------------------------------------
         Non-admin users cannot directly mark
         a transaction as Cleared.
      ------------------------------------------------ */

      if (
        status === "Cleared" &&
        req.auth.role !== "admin"
      ) {
        return res.status(403).json({
          message:
            "Use the Pay Now flow to clear a payment — status can't be set directly",
        });
      }

      /* -----------------------------------------------
         Create transaction in PostgreSQL
      ------------------------------------------------ */

      const transaction =
        await prisma.transaction.create({
          data: {
            id: nanoid(),

            userId: req.auth.sub,

            vendor:
              vendor || null,

            amount,

            type:
              type || "expense",

            category:
              category || null,

            description:
              description || null,

            notes:
              notes || null,

            date: date
              ? new Date(date)
              : new Date(),

            dueDate: due_date
              ? new Date(due_date)
              : null,

            status:
              status || "Pending",

            invoice:
              invoice_number || null,

            method:
              method ||
              payment_method ||
              null,
          },
        });

      /* -----------------------------------------------
         Return created transaction
      ------------------------------------------------ */

      return res
        .status(201)
        .json(
          formatTransaction(
            transaction
          )
        );
    } catch (error) {
      logApiError(error, req);

      return res.status(500).json({
        message:
          "Failed to create transaction",
      });
    }
  }
);

/* =========================================================
   PATCH TRANSACTION
   PATCH /api/transactions/:id
   ========================================================= */

const OWNER_EDITABLE_FIELDS = [
  "notes",
  "category",
  "description",
  "date",
  "method",
  "payment_method",
  "due_date",
];

const ADMIN_EDITABLE_FIELDS = [
  "vendor",
  "amount",
  "status",
  "category",
  "description",
  "invoice",
  "invoice_number",
  "notes",
  "date",
  "method",
  "payment_method",
  "type",
  "due_date",
  "razorpay_order_id",
  "razorpay_payment_id",
];

const FIELD_MAP = {
  vendor: "vendor",

  amount: "amount",

  status: "status",

  category: "category",

  description: "description",

  invoice: "invoice",

  invoice_number: "invoice",

  notes: "notes",

  date: "date",

  method: "method",

  payment_method: "method",

  type: "type",

  due_date: "dueDate",

  razorpay_order_id:
    "razorpayOrderId",

  razorpay_payment_id:
    "razorpayPaymentId",
};

router.patch(
  "/:id",
  requireAuth,
  validateBody(patchSchema),
  async (req, res) => {
    try {
      const transaction =
        await prisma.transaction.findUnique({
          where: {
            id: req.params.id,
          },
        });

      if (!transaction) {
        return res.status(404).json({
          message:
            "Transaction not found",
        });
      }

      const isOwner =
        transaction.userId ===
        req.auth.sub;

      const isAdmin =
        req.auth.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          message: "Not allowed",
        });
      }

      if (
        !isAdmin &&
        transaction.status ===
          "Cleared"
      ) {
        return res.status(400).json({
          message:
            "Cleared transactions cannot be modified",
        });
      }

      if (
        !isAdmin &&
        req.body?.status
      ) {
        return res.status(403).json({
          message:
            "Use the Pay Now flow to clear a payment — status can't be set directly",
        });
      }

      const allowedFields =
        isAdmin
          ? ADMIN_EDITABLE_FIELDS
          : OWNER_EDITABLE_FIELDS;

      const updateData = {};

      for (const field of allowedFields) {
        if (
          req.body[field] ===
          undefined
        ) {
          continue;
        }

        const prismaField =
          FIELD_MAP[field];

        if (!prismaField) {
          continue;
        }

        let value =
          req.body[field];

        if (
          (field === "date" ||
            field === "due_date") &&
          value
        ) {
          value = new Date(value);
        }

        updateData[prismaField] =
          value;
      }

      if (
        Object.keys(updateData)
          .length === 0
      ) {
        return res.json(
          formatTransaction(
            transaction
          )
        );
      }

      const updated =
        await prisma.transaction.update({
          where: {
            id: req.params.id,
          },

          data: updateData,
        });

      return res.json(
        formatTransaction(updated)
      );
    } catch (error) {
      logApiError(error, req);

      return res.status(500).json({
        message:
          "Failed to update transaction",
      });
    }
  }
);

/* =========================================================
   EXPORT ROUTER
   ========================================================= */

export default router;