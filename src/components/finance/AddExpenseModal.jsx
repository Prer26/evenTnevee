import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  "Venue",
  "Catering",
  "Decoration",
  "Photography",
  "Transportation",
  "Entertainment",
  "Marketing",
  "Equipment",
  "Staff",
  "Other"
];

const PAYMENT_METHODS = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Card",
  "Cheque",
  "Other"
];

const STATUS_OPTIONS = ["Pending", "Cleared"];

const baseInputClass =
  "w-full rounded-xl border border-[#5A1835]/30 bg-[#FBF7F0] px-3 py-2.5 text-sm text-[#292525] placeholder:text-[#292525]/50 focus:border-[#7A2348] focus:outline-none focus:ring-2 focus:ring-[#7A2348]/20";

const getTodayString = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  expense_name: "",
  category: "",
  amount: "",
  date: getTodayString(),
  payment_method: "UPI",
  description: "",
  status: "Pending"
});

export default function AddExpenseModal({ open, onClose, onAdd }) {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    const value = event.target.value;

    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const resetForm = () => {
    setForm(emptyForm());
    setErrors({});
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.expense_name?.trim()) {
      nextErrors.expense_name = "Expense name is required.";
    }

    if (!form.category) {
      nextErrors.category = "Please select a category.";
    }

    const parsedAmount = Number(form.amount);

    if (!form.amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = "Enter a valid expense amount.";
    }

    if (!form.date) {
      nextErrors.date = "Please select a date.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const saved = await onAdd({
        ...form,
        expense_name: form.expense_name.trim(),
        description: form.description?.trim() || "",
        amount: Number(form.amount)
      });

      if (!saved) {
        return;
      }

      resetForm();
      onClose();
    } catch {
      // Keep modal open and allow the user to retry.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[540px] rounded-[28px] border border-[#5A1835]/20 bg-[#FBF7F0] p-0 shadow-[0_20px_60px_rgba(90,24,53,0.18)]">
        <div className="border-b border-[#5A1835]/10 p-6 pb-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="font-display text-2xl font-semibold text-[#292525]">
              Add Expense
            </DialogTitle>
            <p className="text-sm text-[#292525]/70">Record a new event expense</p>
          </DialogHeader>
        </div>

        <div className="space-y-4 p-6 pt-5">
          <div className="grid gap-2">
            <Label className="text-sm font-medium text-[#292525]">Expense Name *</Label>
            <Input
              value={form.expense_name}
              onChange={updateField("expense_name")}
              placeholder="Catering"
              className={baseInputClass}
            />
            {errors.expense_name && (
              <p className="text-xs text-[#7A2348]">{errors.expense_name}</p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-[#292525]">Category *</Label>
              <select
                value={form.category}
                onChange={updateField("category")}
                className={baseInputClass}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-xs text-[#7A2348]">{errors.category}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium text-[#292525]">Amount *</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={updateField("amount")}
                placeholder="25000"
                className={baseInputClass}
              />
              {errors.amount && (
                <p className="text-xs text-[#7A2348]">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-[#292525]">Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={updateField("date")}
                className={baseInputClass}
              />
              {errors.date && (
                <p className="text-xs text-[#7A2348]">{errors.date}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-medium text-[#292525]">Payment Method</Label>
              <select
                value={form.payment_method}
                onChange={updateField("payment_method")}
                className={baseInputClass}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium text-[#292525]">Description</Label>
            <Input
              value={form.description}
              onChange={updateField("description")}
              placeholder="Optional notes"
              className={baseInputClass}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium text-[#292525]">Status</Label>
            <select
              value={form.status}
              onChange={updateField("status")}
              className={baseInputClass}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="flex gap-3 border-t border-[#5A1835]/10 bg-[#FBF7F0] p-6 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="border-[#5A1835]/20 bg-[#F3E7D3] text-[#5A1835] hover:bg-[#F3E7D3]/80"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#7A2348] text-white hover:bg-[#69213D]"
          >
            {submitting ? "Saving..." : "Save Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}