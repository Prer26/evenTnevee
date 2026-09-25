import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const EVENT_TYPES = ["Wedding", "Corporate", "Birthday", "Anniversary", "Funeral", "Baby Shower", "Other"];

const inputClass =
  "mt-1.5 w-full rounded-[14px] border border-border bg-cream/60 px-3.5 py-2.5 text-[13px] text-espresso placeholder:text-taupe focus:border-champagne focus:outline-none";
const labelClass = "text-[11px] font-semibold uppercase tracking-[0.14em] text-taupe";

export default function BookingModal({ vendor, onClose, onBooked }) {
  const { user } = useAuth?.() ?? { user: null };
  const { toast } = useToast();

  const [form, setForm] = useState({
    event_type: "Wedding",
    event_date: "",
    guest_count: "",
    client_name: user?.full_name || user?.name || "",
    client_email: user?.email || "",
    client_phone: "",
    budget: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!vendor) return null;

  const isDateBlocked = Array.isArray(vendor.blocked_dates) && vendor.blocked_dates.includes(form.event_date);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.event_date || !form.client_name || !form.client_email) {
      setError("Please fill in the event date, your name, and email.");
      return;
    }

    if (isDateBlocked) {
      setError("This vendor is unavailable on the selected date. Please choose another date.");
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Booking.create({
        vendor_id: vendor.id || vendor.name,
        vendor_name: vendor.name,
        category: vendor.category,
        city: vendor.city,
        event_type: form.event_type,
        event_date: form.event_date,
        guest_count: form.guest_count ? Number(form.guest_count) : undefined,
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone,
        budget: form.budget ? Number(form.budget) : undefined,
        notes: form.notes,
        status: "Pending",
      });

      toast({
        title: "Booking request sent!",
        description: `${vendor.name} will confirm your ${form.event_type.toLowerCase()} booking shortly.`,
      });
      onBooked?.();
      onClose();
    } catch (err) {
      setError("Something went wrong sending your booking. Please try again.");
    } finally {
      setSubmitting(false);
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
          className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_30px_90px_rgba(10,7,4,0.35)]"
        >
          <div className="flex items-center justify-between border-b border-border bg-[linear-gradient(135deg,rgba(255,252,247,0.96),rgba(248,241,227,0.92))] px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(135deg,var(--champagne),var(--bronze))] text-espresso">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-[16px] font-semibold text-espresso">Book {vendor.name}</p>
                <p className="text-[11px] text-taupe">{vendor.category} · {vendor.city}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-white/70 text-espresso transition-colors hover:bg-white"
              aria-label="Close booking form"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelClass}>Event Type</span>
                <select className={inputClass} value={form.event_type} onChange={update("event_type")}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Event Date *</span>
                <input type="date" className={inputClass} value={form.event_date} onChange={update("event_date")} required />
              </label>
              <label className="block">
                <span className={labelClass}>Guest Count</span>
                <input type="number" min="0" className={inputClass} placeholder="e.g. 200" value={form.guest_count} onChange={update("guest_count")} />
              </label>
              <label className="block">
                <span className={labelClass}>Estimated Budget (₹)</span>
                <input type="number" min="0" className={inputClass} placeholder="e.g. 180000" value={form.budget} onChange={update("budget")} />
              </label>
              <label className="block">
                <span className={labelClass}>Your Name *</span>
                <input type="text" className={inputClass} value={form.client_name} onChange={update("client_name")} required />
              </label>
              <label className="block">
                <span className={labelClass}>Your Email *</span>
                <input type="email" className={inputClass} value={form.client_email} onChange={update("client_email")} required />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Your Phone</span>
                <input type="tel" className={inputClass} placeholder="+91" value={form.client_phone} onChange={update("client_phone")} />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelClass}>Notes for the vendor</span>
                <textarea rows={3} className={inputClass} placeholder="Tell them a bit about what you're looking for…" value={form.notes} onChange={update("notes")} />
              </label>
            </div>

            {error && <p className="mt-3 text-[12px] font-medium text-red-600">{error}</p>}

            <div className="mt-5 flex items-center justify-between rounded-[16px] border border-border bg-beige/50 p-3 text-[12px] text-taupe">
              <span>Starting package</span>
              <span className="font-semibold text-espresso">{vendor.price}</span>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-[13px] font-semibold text-espresso"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-espresso px-4 py-2.5 text-[13px] font-semibold text-ivory disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitting ? "Sending…" : "Confirm Booking Request"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
