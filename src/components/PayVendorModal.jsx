import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IndianRupee, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const inputClass =
  "mt-1.5 w-full rounded-[14px] border border-border bg-cream/60 px-3.5 py-2.5 text-[13px] text-espresso placeholder:text-taupe focus:border-champagne focus:outline-none";
const labelClass = "text-[11px] font-semibold uppercase tracking-[0.14em] text-taupe";

export default function PayVendorModal({ booking, onClose, onPaid }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(booking?.budget ? String(booking.budget) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!booking) return null;

  const handlePay = async () => {
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }
    if (!window.Razorpay) {
      setError("Payment widget failed to load. Check your internet connection and try again.");
      return;
    }

    setLoading(true);
    try {
      const order = await base44.payments.createOrder({
        amount: Number(amount),
        booking_id: booking.id,
        vendor_name: booking.vendor_name,
        notes: `Payment for ${booking.event_type} booking with ${booking.vendor_name}`,
      });

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "evenTneve",
        description: `Payment to ${booking.vendor_name}`,
        order_id: order.order_id,
        handler: async (response) => {
          try {
            await base44.payments.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: booking.id,
              vendor_name: booking.vendor_name,
              amount: Number(amount),
            });
            toast({ title: "Payment successful!", description: `₹${amount} paid to ${booking.vendor_name}.` });
            onPaid?.();
            onClose();
          } catch (err) {
            toast({ title: "Payment could not be verified", description: err.message });
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: "#a97c50" },
      });

      rzp.on("payment.failed", (resp) => {
        toast({ title: "Payment failed", description: resp?.error?.description || "Please try again." });
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message || "Could not start payment");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[210] flex items-start justify-center overflow-y-auto overscroll-contain bg-espresso/70 px-4 py-8 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_30px_90px_rgba(10,7,4,0.35)]"
        >
          <div className="flex items-center justify-between border-b border-border bg-[linear-gradient(135deg,rgba(255,252,247,0.96),rgba(248,241,227,0.92))] px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,var(--champagne),var(--bronze))] text-espresso">
                <IndianRupee className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-[16px] font-semibold text-espresso">Pay {booking.vendor_name}</p>
                <p className="text-[11px] text-taupe">{booking.event_type} · {booking.event_date}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/70 text-espresso transition-colors hover:bg-white"
              aria-label="Close payment form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-5">
            <label className="block">
              <span className={labelClass}>Amount (₹)</span>
              <input
                type="number"
                min="1"
                className={inputClass}
                placeholder="e.g. 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            {error && <p className="mt-3 text-[12px] font-medium text-red-600">{error}</p>}

            <p className="mt-4 text-[11px] text-taupe">
              You'll be redirected to Razorpay's secure checkout to complete this payment via card, UPI, or netbanking.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-[13px] font-semibold text-espresso"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-espresso px-4 py-2.5 text-[13px] font-semibold text-ivory disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Opening…" : "Pay Now"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
