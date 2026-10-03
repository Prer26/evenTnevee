import { Router } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";
import { requireAuth } from "../auth.js";
import prisma from "../lib/prisma.js";

const router = Router();

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TfZ7UGMNWvCHif";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "qSPAtpSFsZpkZSpg2fVL7gFN";
  return new Razorpay({ key_id, key_secret });
}

const createOrderSchema = z.object({
  amount: z.number().positive(),
  transaction_id: z.string().min(1),
  vendor_name: z.string().optional(),
  notes: z.string().optional(),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  transaction_id: z.string().min(1),
  vendor_name: z.string().optional(),
  amount: z.number().positive(),
});

/**
 * Create Razorpay Order
 */
router.post("/create-order", requireAuth, async (req, res) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid payment details",
        errors: parsed.error.flatten(),
      });
    }

    const {
      amount,
      transaction_id,
      vendor_name,
      notes,
    } = parsed.data;

    // Make sure the transaction belongs to the logged-in user
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transaction_id,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    if (
      transaction.userId !== req.auth.sub &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    if (transaction.status === "Cleared") {
      return res.status(400).json({
        message: "This transaction is already cleared",
      });
    }

    // Razorpay expects the amount in paise
    const amountInPaise = Math.round(amount * 100);

    const order = await getRazorpayInstance().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `txn_${transaction_id}`,
      notes: {
        transaction_id,
        vendor_name: vendor_name || transaction.vendor || "",
        ...(notes ? { notes } : {}),
      },
    });

    // Store Razorpay order ID
    await prisma.transaction.update({
      where: {
        id: transaction_id,
      },
      data: {
        razorpayOrderId: order.id,
      },
    });

    return res.status(201).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      transaction_id,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);

    return res.status(500).json({
      message: "Failed to create Razorpay order",
    });
  }
});

/**
 * Verify Razorpay Payment
 */
router.post("/verify", requireAuth, async (req, res) => {
  try {
    const parsed = verifyPaymentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid payment verification data",
        errors: parsed.error.flatten(),
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transaction_id,
    } = parsed.data;

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transaction_id,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found",
      });
    }

    if (
      transaction.userId !== req.auth.sub &&
      req.auth.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    // Verify that the order belongs to this transaction
    if (transaction.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        message: "Razorpay order does not match this transaction",
      });
    }

    // Razorpay signature verification
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Invalid Razorpay payment signature",
      });
    }

    // Payment is verified — mark transaction as cleared
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: transaction_id,
      },
      data: {
        status: "Cleared",
        razorpayPaymentId: razorpay_payment_id,
      },
    });

    return res.json({
      success: true,
      message: "Payment verified successfully",
      transaction: {
        id: updatedTransaction.id,
        status: updatedTransaction.status,
        razorpay_order_id: updatedTransaction.razorpayOrderId,
        razorpay_payment_id: updatedTransaction.razorpayPaymentId,
      },
    });
  } catch (error) {
    console.error("Razorpay verification error:", error);

    return res.status(500).json({
      message: "Failed to verify Razorpay payment",
    });
  }
});

export default router;