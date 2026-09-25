import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";
import {
  AlertCircle,
  BrainCircuit,
  ChevronRight,
  Download,
  Plus,
  Receipt,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import AddExpenseModal from "@/components/finance/AddExpenseModal";
import VendorLayout from "@/components/VendorLayout";
import AdminLayout from "@/components/AdminLayout";

const KPI_ITEMS = (stats) => [
  {
    label: "Total Expenses",
    value: stats.totalExpenses,
    change: `${stats.transactionCount} transactions`,
    detail: "from saved transactions",
    chip: "Live",
    icon: Wallet
  },
  {
    label: "Cleared",
    value: stats.clearedAmount,
    change: `${stats.clearedCount} cleared`,
    detail: "saved transactions",
    chip: "Live",
    icon: TrendingUp
  },
  {
    label: "Pending",
    value: stats.pendingAmount,
    change: `${stats.pendingCount} pending`,
    detail: "awaiting payment",
    chip: "Follow-up",
    icon: Receipt
  },
  {
    label: "Overdue",
    value: stats.overdueAmount,
    change: `${stats.overdueCount} overdue`,
    detail: "needs attention",
    chip: "Attention",
    icon: AlertCircle
  },
  {
    label: "Transactions",
    value: String(stats.transactionCount),
    change: "saved records",
    detail: "in the current account",
    chip: "Live",
    icon: Receipt
  },
  {
    label: "Categories",
    value: String(stats.categoryCount),
    change: "used categories",
    detail: "from saved transactions",
    chip: "Live",
    icon: Wallet
  }
];

const buildExpenseSlices = (categoryTotals, totalExpenses) => {
  if (!totalExpenses) return [];

  const colors = [
    "#7A2348",
    "#5A1835",
    "#431126",
    "#F3E7D3",
    "#FBF7F0",
    "#292525"
  ];

  let displayedPercentage = 0;
  const entries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return entries.map(([label, amount], index) => {
    const value = index === entries.length - 1
      ? 100 - displayedPercentage
      : Math.round((amount / totalExpenses) * 100);
    displayedPercentage += value;

    return {
      label,
      value,
      amount: `₹ ${amount.toLocaleString("en-IN")}`,
      color: colors[index % colors.length]
    };
  });
};

const normalizeStatus = (status) =>
  status ? String(status).trim() : "";

const normalizeTransaction = (t) => ({
  id: t.id,
  vendor: t.vendor || "",
  event: t.event_name || "",
  description: t.description || t.vendor || t.event_name || "",
  category: t.category?.trim() || "Uncategorized",
  invoice: t.invoice || "",
  amount: `₹ ${Number(t.amount || 0).toLocaleString("en-IN")}`,
  raw_amount: Number(t.amount || 0),
  method: t.method || "",
  status: normalizeStatus(t.status),
  priority: t.priority || "Normal",
  type: t.type || t.transaction_type || "",
  date: t.created_date || t.date || t.transaction_date || "",
  due_date: t.due_date || "",
  payment_method: t.method || "",
  event_name: t.event_name || ""
});

const COPILOT_ACTIONS = [
  {
    label: "Explain",
    prompt:
      "Explain the current financial state using only the saved transaction data available on this page. Do not invent values. Keep it under 100 words."
  },
  {
    label: "Optimize Budget",
    prompt:
      "Suggest 3 practical cost-optimization ideas using only the saved transaction data available on this page. Do not invent values. Keep it under 100 words."
  },
  {
    label: "Review Payments",
    prompt:
      "Review the saved pending and overdue transactions and summarize what needs attention. Do not invent values. Keep it under 80 words."
  },
  {
    label: "Generate Report",
    prompt:
      "Generate a brief financial report using only the saved transaction data available on this page. Do not invent values. Keep it under 120 words."
  },
  {
    label: "Find Cost Savings",
    prompt:
      "Identify possible cost-saving opportunities from the saved transaction categories and amounts. Do not invent values. Keep it under 100 words."
  }
];

const statusTone = {
  Cleared: "bg-[#F3E7D3] text-[#7A2348]",
  Pending: "bg-[#F3E7D3] text-[#7A2348]",
  Overdue: "bg-[#7A2348]/15 text-[#7A2348]"
};

const priorityTone = {
  Urgent: "bg-[#7A2348]/15 text-[#7A2348]",
  High: "bg-[#F3E7D3] text-[#7A2348]",
  Normal: "bg-[#F3E7D3] text-[#7A2348]"
};

const fallbackTone = "bg-[#F3E7D3] text-[#7A2348]";

function ExpenseDonut({ slices, totalExpenses, loading }) {
  const [active, setActive] = useState(null);

  let cumulative = 0;

  const gradientStops = slices
    .map((slice) => {
      const start = cumulative;
      cumulative += slice.value;

      return `${slice.color} ${start}% ${cumulative}%`;
    })
    .join(", ");

  if (loading) {
    return /* @__PURE__ */ jsx("div", {
      className: "h-44 w-full animate-pulse rounded-[20px] bg-[#F3E7D3]"
    });
  }

  if (!slices.length) {
    return /* @__PURE__ */ jsx("div", {
      className: "rounded-[20px] border border-dashed border-[#5A1835] bg-[#FBF7F0] p-8 text-center text-[13px] text-[#7A2348]/70",
      children: "No expense data"
    });
  }

  return /* @__PURE__ */ jsxs(
    "div",
    {
      className:
        "flex flex-col items-center gap-6 sm:flex-row sm:items-start",
      children: [
        /* @__PURE__ */ jsx("div", {
          className:
            "relative grid h-44 w-44 shrink-0 place-items-center rounded-full",
          style: {
            background: gradientStops
              ? `conic-gradient(${gradientStops})`
              : "#F3E7D3"
          },
          children: /* @__PURE__ */ jsx("div", {
            className:
              "grid h-28 w-28 place-items-center rounded-full bg-white text-center shadow-soft",
            children: /* @__PURE__ */ jsxs("div", {
              children: [
                /* @__PURE__ */ jsx("p", {
                  className:
                    "text-[11px] uppercase tracking-[0.14em] text-[#7A2348]/70",
                  children:
                    active !== null
                      ? slices[active].label
                      : "Total"
                }),
                /* @__PURE__ */ jsx("p", {
                  className:
                    "mt-1 font-display text-lg font-semibold text-[#7A2348]",
                  children:
                    active !== null
                      ? slices[active].amount
                      : `₹ ${Number(totalExpenses || 0).toLocaleString("en-IN")}`
                })
              ]
            })
          })
        }),

        /* @__PURE__ */ jsx("ul", {
          className: "grid min-w-0 flex-1 grid-cols-1 gap-2.5",
          children: slices.map((slice, index) =>
            /* @__PURE__ */ jsxs(
              "li",
              {
                onMouseEnter: () => setActive(index),
                onMouseLeave: () => setActive(null),
                className:
                  "flex cursor-default items-center justify-between gap-2 rounded-xl border border-[#5A1835] bg-[#FBF7F0] px-2.5 py-1.5 text-[12px] transition-colors hover:border-[#7A2348]",
                children: [
                  /* @__PURE__ */ jsxs("span", {
                    className:
                      "flex min-w-0 flex-1 items-center gap-1.5 break-words text-[#7A2348]",
                    children: [
                      /* @__PURE__ */ jsx("span", {
                        className: "h-2.5 w-2.5 rounded-full",
                        style: {
                          backgroundColor: slice.color
                        }
                      }),
                      /* @__PURE__ */ jsx("span", {
                        className: "min-w-0 break-words",
                        children: slice.label
                      })
                    ]
                  }),

                  /* @__PURE__ */ jsxs("span", {
                    className:
                      "shrink-0 font-semibold text-[#7A2348]/70",
                    children: [slice.value, "%"]
                  })
                ]
              },
              slice.label
            )
          )
        })
      ]
    }
  );
}

export default function FinancialTrackerPage() {
  const { user } = useAuth();
  const isVendor = user?.account_type === "vendor";

  const [range, setRange] = useState("3M");
  const [txns, setTxns] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(true);
  const [txnsError, setTxnsError] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const { toast } = useToast();

  const mapTxns = (data) => data.map(normalizeTransaction);

  const csvEscape = (value) => {
    const safeValue = value == null ? "" : String(value);

    return /[",\n\r]/.test(safeValue)
      ? `"${safeValue.replace(/"/g, '""')}"`
      : safeValue;
  };

  const exportReport = () => {
    if (!txns || txns.length === 0) {
      toast({
        title: "No transaction data available",
        description:
          "There are no transactions to export yet."
      });

      return;
    }

    const reportDate = new Date().toISOString();
    const categoryBreakdown = Object.entries(
      txns.reduce((totals, txn) => {
        const category = txn.category || "Uncategorized";
        const amount = Number(txn.raw_amount || 0);

        totals[category] = (totals[category] || 0) + amount;

        return totals;
      }, {})
    ).sort((a, b) => b[1] - a[1]);

    const csvRows = [
      ["Eventneve Financial Report"],
      ["Report generation date", reportDate],
      ["Total transactions", String(txns.length)],
      ["Total expenses", formatMoney(totalExpenses)],
      ["Total income/revenue", "N/A (not available in current transaction data)"],
      ["Pending transactions", String(pendingTxns.length)],
      ["Overdue transactions", String(overdueTxns.length)],
      [""],
      ["Category breakdown"],
      ["Category", "Amount"],
      ...categoryBreakdown.map(([category, amount]) => [
        category,
        formatMoney(amount)
      ]),
      [""],
      ["Transaction records"],
      [
        "Date",
        "Description",
        "Vendor",
        "Event",
        "Category",
        "Amount",
        "Type",
        "Status",
        "Payment method",
        "Invoice",
        "Priority",
        "ID"
      ],
      ...txns.map((txn) => [
        txn.date || "",
        txn.description || txn.event || txn.vendor || "",
        txn.vendor || "",
        txn.event || txn.event_name || "",
        txn.category || "",
        txn.amount || "",
        txn.type || "",
        txn.status || "",
        txn.payment_method || txn.method || "",
        txn.invoice || "",
        txn.priority || "",
        txn.id || ""
      ])
    ];

    const csvContent = csvRows
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "Eventneve_Financial_Report.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(downloadUrl);
  };

  const refreshTxns = async () => {
    setTxnsLoading(true);
    setTxnsError(false);
    try {
      const data =
        await base44.entities.Transaction.list(
          "-created_date",
          50
        );

      setTxns(mapTxns(data || []));
    } catch {
      setTxnsError(true);
    } finally {
      setTxnsLoading(false);
    }
  };

  useEffect(() => {
    refreshTxns();
  }, []);

  const handleAddExpense = async (formData) => {
    try {
      const amount = Number(formData.amount || 0);
      const expenseName =
        formData.expense_name ||
        formData.vendor ||
        "New Expense";
      const category = formData.category || "Other";
      const paymentMethod =
        formData.payment_method ||
        formData.method ||
        "UPI";
      const status = formData.status || "Pending";
      const dateValue = formData.date || new Date().toISOString().slice(0, 10);

      await base44.entities.Transaction.create({
        vendor: expenseName,
        description: formData.description || expenseName,
        amount,
        amount_display: `₹ ${amount.toLocaleString("en-IN")}`,
        status,
        method: paymentMethod,
        payment_method: paymentMethod,
        priority: "Normal",
        category,
        type: "expense",
        date: dateValue,
        created_date: dateValue,
        event_name: expenseName,
        invoice_number:
          formData.invoice_number ||
          `INV-${Date.now().toString().slice(-4)}`
      });

      toast({
        title: "Expense added successfully.",
        description: `${expenseName} — ₹ ${amount.toLocaleString(
          "en-IN"
        )}`
      });

      await refreshTxns();
      return true;
    } catch {
      toast({
        title: "Unable to save expense. Please try again.",
        description: "The transaction could not be saved."
      });

      return false;
    }
  };

  const buildAILiveData = () => {
    const cleanTransactions = txns.map((txn) => ({
      id: txn.id || "",
      vendor: txn.vendor || "",
      event: txn.event || txn.event_name || "",
      description: txn.description || "",
      category: txn.category || "Uncategorized",
      amount: Number(txn.raw_amount || 0),
      type: txn.type || "",
      status: txn.status || "",
      payment_method: txn.payment_method || txn.method || "",
      invoice: txn.invoice || "",
      priority: txn.priority || "Normal",
      date: txn.date || "",
      due_date: txn.due_date || ""
    }));

    const categoryBreakdown = Object.entries(
      cleanTransactions
        .filter((txn) => txn.type === "expense")
        .reduce((totals, txn) => {
          totals[txn.category] =
            (totals[txn.category] || 0) + txn.amount;
          return totals;
        }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount }));

    return {
      transaction_count: cleanTransactions.length,
      total_expenses: Number(totalExpenses || 0),
      cleared_amount: Number(clearedAmount || 0),
      pending_amount: Number(pendingAmount || 0),
      overdue_amount: Number(overdueAmount || 0),
      cleared_count: clearedTxns.length,
      pending_count: pendingTxns.length,
      overdue_count: overdueTxns.length,
      category_count: categoryCount,
      category_breakdown: categoryBreakdown,
      transactions: cleanTransactions
    };
  };

  const handleCopilotAction = async (action) => {
    if (copilotLoading || !txns.length) return;

    setCopilotLoading(true);
    setActiveAction(action.label);

    try {
      const liveData = buildAILiveData();
      const res =
        await base44.integrations.Core.InvokeLLM({
          prompt: `${action.prompt}\n\nIMPORTANT: Use ONLY the live financial data below. Do not invent or assume missing budget, revenue, profit, forecast, or transaction values. If a value is not present, explicitly say it is unavailable.\n\nLIVE EVENTNEVE FINANCIAL DATA:\n${JSON.stringify(liveData, null, 2)}`,
          response_json_schema: {
            type: "object",
            properties: {
              response: {
                type: "string"
              }
            },
            required: ["response"]
          }
        });

      const text =
        typeof res === "string"
          ? res
          : (res && res.response) ||
            (res && res.summary) ||
            "No response generated.";

      setCopilotResponse(text);
    } catch {
      setCopilotResponse(
        "I couldn't process that request right now. Please try again later."
      );
    } finally {
      setCopilotLoading(false);
      setActiveAction(null);
    }
  };

  const handleGenerateAIReport = async () => {
    if (aiLoading || !txns.length) {
      if (!txns.length) {
        toast({
          title: "No transaction data available",
          description: "Add at least one expense before generating an AI report."
        });
      }
      return;
    }

    setAiLoading(true);

    try {
      const liveData = buildAILiveData();

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a financial report for Eventneve using ONLY the live transaction data provided below. Do not invent budget, revenue, profit, forecast, margin, or any other value that is not present in the data. Do not use generic placeholder figures. Clearly state when information is unavailable.\n\nInclude:\n1. Executive Summary\n2. Expense Analysis\n3. Payment Status\n4. Key Insights\n5. Two actionable recommendations\n\nKeep it professional, concise, and under 250 words.\n\nLIVE EVENTNEVE FINANCIAL DATA:\n${JSON.stringify(liveData, null, 2)}`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            recommendations: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["summary", "recommendations"]
        }
      });

      setAiReport(res || {
        summary: "No report was generated.",
        recommendations: []
      });

      toast({
        title: "AI report generated",
        description: "The report uses the saved transaction data currently loaded on this page."
      });
    } catch {
      setAiReport({
        summary: "Unable to generate the report right now. Please try again later.",
        recommendations: []
      });

      toast({
        title: "AI report failed",
        description: "Please try again in a moment."
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handlePayNow = async (payment) => {
    if (!payment.id) {
      toast({
        title: "Cannot process payment",
        description:
          "This entry has no saved record to pay against."
      });

      return;
    }

    if (!window.Razorpay) {
      toast({
        title: "Payment widget failed to load",
        description:
          "Check your connection and try again."
      });

      return;
    }

    try {
      const order =
        await base44.payments.createOrder({
          amount: payment.raw_amount,
          transaction_id: payment.id,
          vendor_name: payment.vendor,
          notes: `Clearing invoice ${
            payment.invoice || ""
          } for ${payment.vendor}`
        });

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Eventneve",
        description: `Payment to ${payment.vendor}`,
        order_id: order.order_id,

        handler: async (response) => {
          try {
            await base44.payments.verify({
              razorpay_order_id:
                response.razorpay_order_id,

              razorpay_payment_id:
                response.razorpay_payment_id,

              razorpay_signature:
                response.razorpay_signature,

              transaction_id: payment.id,
              vendor_name: payment.vendor,
              amount: payment.raw_amount
            });

            toast({
              title: "Payment cleared!",
              description: `${payment.vendor} — ${payment.amount}`
            });

            await refreshTxns();
          } catch (err) {
            toast({
              title: "Payment could not be verified",
              description:
                err.message ||
                "Please try again."
            });
          }
        },

        theme: {
          color: "#7A2348"
        }
      });

      rzp.on(
        "payment.failed",
        (resp) => {
          toast({
            title: "Payment failed",
            description:
              resp?.error?.description ||
              "Please try again."
          });
        }
      );

      rzp.open();
    } catch (err) {
      toast({
        title: "Payment failed",
        description:
          err.message ||
          "Please try again."
      });
    }
  };

  const filteredTxns = txns.filter((t) => {
    const matchesStatus =
      statusFilter === "All" ||
      t.status === statusFilter;

    const q = searchQuery.toLowerCase();

    const matchesSearch =
      !q ||
      (t.vendor || "")
        .toLowerCase()
        .includes(q) ||
      (t.event || "")
        .toLowerCase()
        .includes(q) ||
      (t.category || "")
        .toLowerCase()
        .includes(q) ||
      (t.invoice || "")
        .toLowerCase()
        .includes(q);

    return matchesStatus && matchesSearch;
  });

  const formatMoney = (amount) =>
    `₹ ${Number(amount || 0).toLocaleString(
      "en-IN"
    )}`;

  const financialMetrics = useMemo(() => {
    const expenseTxns = txns.filter((t) => t.type === "expense");
    const totalExpenses = expenseTxns.reduce(
      (sum, t) => sum + t.raw_amount,
      0
    );
    const categoryTotals = expenseTxns.reduce((totals, t) => {
      const category = t.category?.trim() || "Uncategorized";
      totals[category] = (totals[category] || 0) + t.raw_amount;
      return totals;
    }, {});
    const categoryNames = new Set(
      txns.map((t) => t.category?.trim() || "Uncategorized")
    );
    const clearedTxns = txns.filter((t) => t.status === "Cleared");
    const pendingTxns = txns.filter((t) => t.status === "Pending");
    const overdueTxns = txns.filter((t) => t.status === "Overdue");
    const clearedAmount = clearedTxns.reduce((sum, t) => sum + t.raw_amount, 0);
    const pendingAmount = pendingTxns.reduce((sum, t) => sum + t.raw_amount, 0);
    const overdueAmount = overdueTxns.reduce((sum, t) => sum + t.raw_amount, 0);
    const scoreReasons = [];
    let healthScore = 100;

    if (overdueTxns.length) {
      healthScore -= 10 + Math.max(0, overdueTxns.length - 1) * 5;
      scoreReasons.push(`${overdueTxns.length} overdue transaction${overdueTxns.length === 1 ? "" : "s"}`);
    }
    if (totalExpenses && pendingAmount > totalExpenses * 0.5) {
      healthScore -= 5;
      scoreReasons.push("pending amount is more than half of expenses");
    }
    if (txns.length && clearedAmount === 0) {
      healthScore -= 5;
      scoreReasons.push("no expenses are cleared");
    }

    const alerts = [
      ...pendingTxns.map((t) => ({
        label: `Pending payment for ${t.vendor || "Unnamed vendor"}`,
        severity: "Medium",
        detail: t.invoice ? `Invoice ${t.invoice}` : "Payment awaiting clearance"
      })),
      ...overdueTxns.map((t) => ({
        label: `Overdue payment for ${t.vendor || "Unnamed vendor"}`,
        severity: "High",
        detail: t.invoice ? `Invoice ${t.invoice}` : "Payment requires attention"
      }))
    ];

    return {
      expenseTxns,
      totalExpenses,
      categoryTotals,
      categoryCount: categoryNames.size,
      clearedTxns,
      pendingTxns,
      overdueTxns,
      clearedAmount,
      pendingAmount,
      overdueAmount,
      expenseSlices: buildExpenseSlices(categoryTotals, totalExpenses),
      alerts,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      healthExplanation: txns.length
        ? `Based on ${txns.length} saved transaction${txns.length === 1 ? "" : "s"}${scoreReasons.length ? `, with ${scoreReasons.join(" and ")}.` : ", with no current deductions."}`
        : "Not enough data"
    };
  }, [txns]);

  const {
    totalExpenses,
    categoryCount,
    clearedTxns,
    pendingTxns,
    overdueTxns,
    clearedAmount,
    pendingAmount,
    overdueAmount,
    expenseSlices,
    alerts
  } = financialMetrics;

  const liveStats = {
    totalExpenses: txnsLoading ? "Loading…" : formatMoney(totalExpenses),
    clearedAmount: txnsLoading ? "Loading…" : formatMoney(clearedAmount),
    pendingAmount: txnsLoading ? "Loading…" : formatMoney(pendingAmount),
    overdueAmount: txnsLoading ? "Loading…" : formatMoney(overdueAmount),
    transactionCount: txnsLoading ? "…" : txns.length,
    clearedCount: txnsLoading ? "…" : clearedTxns.length,
    pendingCount: txnsLoading ? "…" : pendingTxns.length,
    overdueCount: txnsLoading ? "…" : overdueTxns.length,
    categoryCount: txnsLoading ? "…" : categoryCount
  };

  const chartPoints = financialMetrics.expenseTxns
    .slice(-7)
    .map((t) => t.raw_amount);

  const points = chartPoints.length
    ? chartPoints
    : [0];

  const max = Math.max(...points, 1);

  const visibleAlerts = alerts
    .map((alert, index) => ({
      ...alert,
      index
    }))
    .filter(
      (a) =>
        !dismissedAlerts.has(a.index)
    );

  const txnCounts = {
    All: txns.length,

    Cleared: txns.filter(
      (t) => t.status === "Cleared"
    ).length,

    Pending: txns.filter(
      (t) => t.status === "Pending"
    ).length,

    Overdue: txns.filter(
      (t) => t.status === "Overdue"
    ).length
  };

  const path = points
    .map(
      (value, index) =>
        `${index === 0 ? "M" : "L"} ${
          20 + (index * 440) / Math.max(points.length - 1, 1)
        } ${
          180 -
          (value / max) * 120
        }`
    )
    .join(" ");

  const upcomingPayments = [...pendingTxns, ...overdueTxns];

  const pageBody =
    /* @__PURE__ */ jsxs(
      "div",
      {
        className:
          "relative mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8",

        children: [
          /*
           * BACKGROUND
           */
          /* @__PURE__ */ jsxs(
            "div",
            {
              "aria-hidden": true,

              className:
                "pointer-events-none absolute inset-0 -z-10 overflow-hidden",

              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className:
                      "absolute -top-10 left-1/3 h-96 w-96 rounded-full bg-[#5A1835]/20 blur-[120px]"
                  }
                ),

                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className:
                      "absolute right-0 top-64 h-72 w-72 rounded-full bg-[#F3E7D3]/30 blur-[100px]"
                  }
                )
              ]
            }
          ),

          /*
           * HEADER
           */
          /* @__PURE__ */ jsxs(
            "header",
            {
              className:
                "flex flex-col justify-between gap-6 lg:flex-row lg:items-end",

              children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className:
                      "max-w-2xl",

                    children: [
                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className:
                            "text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A2348]",

                          children:
                            "Financial Tracker"
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "h1",
                        {
                          className:
                            "mt-3 font-display text-4xl font-bold tracking-tight text-[#7A2348] sm:text-5xl",

                          children:
                            "Financial Tracker"
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className:
                            "mt-3 text-[15px] leading-relaxed text-[#7A2348]/70",

                          children:
                            isVendor
                              ? "Track, analyze and optimize your business finances with AI."
                              : "Track, analyze and optimize every event's finances with AI."
                        }
                      )
                    ]
                  }
                ),

                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className:
                      "flex flex-wrap gap-2",

                    children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",

                          onClick: exportReport,

                          className:
                            "inline-flex items-center gap-2 rounded-full bg-[#7A2348] px-4 py-2.5 text-[13px] font-semibold text-white shadow-soft transition-colors hover:bg-[#5A1835]",

                          children: [
                            /* @__PURE__ */ jsx(
                              Download,
                              {
                                className:
                                  "h-4 w-4"
                              }
                            ),

                            " Export Report"
                          ]
                        }
                      ),

                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",

                          disabled: aiLoading,

                          onClick: handleGenerateAIReport,

                          className:
                            "inline-flex items-center gap-2 rounded-full border border-[#5A1835] bg-[#F3E7D3] px-4 py-2.5 text-[13px] font-semibold text-[#7A2348] shadow-soft transition-colors hover:bg-[#5A1835] disabled:opacity-60",

                          children: [
                            /* @__PURE__ */ jsx(
                              Sparkles,
                              {
                                className:
                                  "h-4 w-4"
                              }
                            ),

                            aiLoading
                              ? " Generating…"
                              : " Generate AI Report"
                          ]
                        }
                      ),

                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",

                          onClick: () =>
                            setShowAddModal(
                              true
                            ),

                          className:
                            "inline-flex items-center gap-2 rounded-full bg-[#7A2348] px-5 py-2.5 text-[13px] font-semibold text-white shadow-soft transition-colors hover:bg-[#5A1835]",

                          children: [
                            /* @__PURE__ */ jsx(
                              Plus,
                              {
                                className:
                                  "h-4 w-4"
                              }
                            ),

                            " Add Expense"
                          ]
                        }
                      )
                    ]
                  }
                )
              ]
            }
          ),

          txnsError
            ? /* @__PURE__ */ jsxs(
                "div",
                {
                  className:
                    "mt-8 flex items-center justify-between gap-4 rounded-[20px] border border-[#5A1835] bg-[#FBF7F0] p-4 text-[13px] text-[#7A2348]",
                  children: [
                    /* @__PURE__ */ jsx("span", {
                      children: "Unable to load financial data"
                    }),
                    /* @__PURE__ */ jsx("button", {
                      type: "button",
                      onClick: refreshTxns,
                      className:
                        "rounded-full bg-[#7A2348] px-4 py-2 font-semibold text-white hover:bg-[#5A1835]",
                      children: "Retry"
                    })
                  ]
                }
              )
            : null,

          /*
           * AI REPORT
           */
          aiReport
            ? /* @__PURE__ */ jsxs(
                motion.div,
                {
                  initial: {
                    opacity: 0,
                    y: 16
                  },

                  animate: {
                    opacity: 1,
                    y: 0
                  },

                  className:
                    "mt-8 rounded-[28px] border border-[#5A1835] bg-gradient-to-br from-white to-[#F3E7D3] p-6 shadow-luxe sm:p-8",

                  children: [
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className:
                          "flex items-start justify-between gap-3",

                        children: [
                          /* @__PURE__ */ jsxs(
                            "div",
                            {
                              className:
                                "flex items-center gap-3",

                              children: [
                                /* @__PURE__ */ jsx(
                                  "span",
                                  {
                                    className:
                                      "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5A1835] to-[#7A2348] text-white",

                                    children:
                                      /* @__PURE__ */ jsx(
                                        BrainCircuit,
                                        {
                                          className:
                                            "h-5 w-5"
                                        }
                                      )
                                  }
                                ),

                                /* @__PURE__ */ jsxs(
                                  "div",
                                  {
                                    children: [
                                      /* @__PURE__ */ jsx(
                                        "p",
                                        {
                                          className:
                                            "font-display text-lg font-semibold text-[#7A2348]",

                                          children:
                                            "AI Financial Report"
                                        }
                                      ),

                                      /* @__PURE__ */ jsx(
                                        "p",
                                        {
                                          className:
                                            "text-[12.5px] text-[#7A2348]/70",

                                          children:
                                            "Generated from saved transaction data"
                                        }
                                      )
                                    ]
                                  }
                                )
                              ]
                            }
                          ),

                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",

                              onClick: () =>
                                setAiReport(
                                  null
                                ),

                              className:
                                "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/70 text-[#7A2348] transition-colors hover:bg-white",

                              "aria-label":
                                "Close report",

                              children:
                                /* @__PURE__ */ jsx(
                                  X,
                                  {
                                    className:
                                      "h-4 w-4"
                                  }
                                )
                            }
                          )
                        ]
                      }
                    ),

                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        className:
                          "mt-5 space-y-4",

                        children: [
                          /* @__PURE__ */ jsxs(
                            "div",
                            {
                              children: [
                                /* @__PURE__ */ jsx(
                                  "p",
                                  {
                                    className:
                                      "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A2348]",

                                    children:
                                      "Executive Summary"
                                  }
                                ),

                                /* @__PURE__ */ jsx(
                                  "p",
                                  {
                                    className:
                                      "mt-2 whitespace-pre-line text-[14px] leading-relaxed text-[#7A2348]",

                                    children:
                                      aiReport.summary ||
                                      "No summary available."
                                  }
                                )
                              ]
                            }
                          ),

                          aiReport.recommendations &&
                          aiReport
                            .recommendations
                            .length >
                            0
                            ? /* @__PURE__ */ jsxs(
                                "div",
                                {
                                  children: [
                                    /* @__PURE__ */ jsx(
                                      "p",
                                      {
                                        className:
                                          "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A2348]",

                                        children:
                                          "Recommendations"
                                      }
                                    ),

                                    /* @__PURE__ */ jsx(
                                      "ul",
                                      {
                                        className:
                                          "mt-2 space-y-2",

                                        children:
                                          aiReport.recommendations.map(
                                            (
                                              rec,
                                              i
                                            ) =>
                                              /* @__PURE__ */ jsxs(
                                                "li",
                                                {
                                                  className:
                                                    "flex items-start gap-2 text-[14px] leading-relaxed text-[#7A2348]",

                                                  children: [
                                                    /* @__PURE__ */ jsx(
                                                      "span",
                                                      {
                                                        className:
                                                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7A2348]"
                                                      }
                                                    ),

                                                    rec
                                                  ]
                                                },
                                                i
                                              )
                                          )
                                      }
                                    )
                                  ]
                                }
                              )
                            : null
                        ]
                      }
                    )
                  ]
                }
              )
            : null,

          /*
           * KPI CARDS
           */
          /* @__PURE__ */ jsx(
            "section",
            {
              className:
                "mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3",

              children:
                KPI_ITEMS(liveStats).map(
                  ({
                    label,
                    value,
                    change,
                    detail,
                    chip,
                    icon: Icon
                  }) =>
                    /* @__PURE__ */ jsxs(
                      motion.article,
                      {
                        whileHover: {
                          y: -4
                        },

                        className:
                          "rounded-[28px] border border-[#5A1835] bg-gradient-to-br from-[#F3E7D3] to-white p-5 shadow-soft",

                        children: [
                          /* @__PURE__ */ jsxs(
                            "div",
                            {
                              className:
                                "flex items-start justify-between",

                              children: [
                                /* @__PURE__ */ jsxs(
                                  "div",
                                  {
                                    children: [
                                      /* @__PURE__ */ jsx(
                                        "p",
                                        {
                                          className:
                                            "text-[10px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                                          children:
                                            label
                                        }
                                      ),

                                      /* @__PURE__ */ jsx(
                                        "p",
                                        {
                                          className:
                                            "mt-3 font-display text-2xl font-semibold text-[#7A2348]",

                                          children:
                                            value
                                        }
                                      )
                                    ]
                                  }
                                ),

                                /* @__PURE__ */ jsx(
                                  "div",
                                  {
                                    className:
                                      "rounded-2xl bg-white/70 p-2.5 text-[#7A2348] shadow-soft",

                                    children:
                                      /* @__PURE__ */ jsx(
                                        Icon,
                                        {
                                          className:
                                            "h-4 w-4"
                                        }
                                      )
                                  }
                                )
                              ]
                            }
                          ),

                          /* @__PURE__ */ jsxs(
                            "div",
                            {
                              className:
                                "mt-4 flex items-center justify-between",

                              children: [
                                /* @__PURE__ */ jsxs(
                                  "div",
                                  {
                                    children: [
                                      /* @__PURE__ */ jsx(
                                        "p",
                                        {
                                          className:
                                            "text-[12px] font-semibold text-[#7A2348]",

                                          children:
                                            change
                                        }
                                      ),

                                      /* @__PURE__ */ jsx(
                                        "p",
                                        {
                                          className:
                                            "mt-1 text-[12px] text-[#7A2348]/70",

                                          children:
                                            detail
                                        }
                                      )
                                    ]
                                  }
                                ),

                                /* @__PURE__ */ jsx(
                                  "span",
                                  {
                                    className:
                                      "rounded-full border border-[#5A1835] bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[#7A2348]",

                                    children:
                                      chip
                                  }
                                )
                              ]
                            }
                          ),

                        ]
                      },
                      label
                    )
                )
            }
          ),

          /*
           * ANALYTICS
           */
          /* @__PURE__ */ jsxs(
            "section",
            {
              className:
                "mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]",

              children: [
                /* @__PURE__ */ jsxs(
                  motion.div,
                  {
                    initial: {
                      opacity: 0,
                      y: 16
                    },

                    animate: {
                      opacity: 1,
                      y: 0
                    },

                    className:
                      "rounded-[28px] border border-[#5A1835] bg-white p-5 shadow-soft",

                    children: [
                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className:
                            "flex flex-wrap items-center justify-between gap-3",

                          children: [
                            /* @__PURE__ */ jsxs(
                              "div",
                              {
                                children: [
                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "text-[10px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                                      children:
                                        "Transaction analytics"
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "mt-1 font-display text-xl font-semibold text-[#7A2348]",

                                      children:
                                        "Live financial activity"
                                    }
                                  )
                                ]
                              }
                            ),

                            /* @__PURE__ */ jsx(
                              "div",
                              {
                                className:
                                  "flex gap-1 rounded-full border border-[#5A1835] bg-[#F3E7D3] p-1 text-[11px] font-medium text-[#7A2348]/70",

                                children: [
                                  "1M",
                                  "3M",
                                  "6M",
                                  "1Y"
                                ].map(
                                  (label) =>
                                    /* @__PURE__ */ jsx(
                                      "button",
                                      {
                                        type: "button",

                                        onClick:
                                          () =>
                                            setRange(
                                              label
                                            ),

                                        className:
                                          `rounded-full px-2.5 py-1 transition-colors ${
                                            range ===
                                            label
                                              ? "bg-[#7A2348] text-white"
                                              : "hover:text-[#7A2348]"
                                          }`,

                                        children:
                                          label
                                      },
                                      label
                                    )
                                )
                              }
                            )
                          ]
                        }
                      ),

                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className:
                            "mt-4 flex flex-wrap gap-3 text-[12px] font-medium text-[#7A2348]/70",

                          children: [
                            /* @__PURE__ */ jsxs(
                              "span",
                              {
                                className:
                                  "inline-flex items-center gap-2",

                                children: [
                                  /* @__PURE__ */ jsx(
                                    "span",
                                    {
                                      className:
                                        "h-2.5 w-2.5 rounded-full bg-[#7A2348]"
                                    }
                                  ),

                                  " Expenses"
                                ]
                              }
                            ),

                            /* @__PURE__ */ jsxs(
                              "span",
                              {
                                className:
                                  "inline-flex items-center gap-2",

                                children: [
                                  /* @__PURE__ */ jsx(
                                    "span",
                                    {
                                      className:
                                        "h-2.5 w-2.5 rounded-full bg-[#5A1835]"
                                    }
                                  ),

                                  " Recent activity"
                                ]
                              }
                            )
                          ]
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className:
                            "relative mt-4 h-56 rounded-[20px] border border-[#5A1835] bg-[#FBF7F0] p-4",

                          children:
                            /* @__PURE__ */ jsx(
                              "svg",
                              {
                                viewBox:
                                  "0 0 480 220",

                                className:
                                  "h-full w-full",

                                children: [
                                  [40, 100, 160].map((y) =>
                                    /* @__PURE__ */ jsx("line", {
                                      x1: "20",
                                      x2: "460",
                                      y1: y,
                                      y2: y,
                                      stroke: "#5A1835",
                                      strokeOpacity: "0.12",
                                      strokeWidth: "1"
                                    }, y)
                                  ),
                                  /* @__PURE__ */ jsx(
                                    motion.path,
                                    {
                                      d: path,
                                      fill: "none",
                                      stroke: "#7A2348",
                                      strokeWidth: "3",
                                      strokeLinecap: "round",
                                      strokeLinejoin: "round",
                                      initial: { pathLength: 0 },
                                      animate: { pathLength: 1 },
                                      transition: { duration: 0.8 }
                                    }
                                  ),
                                  points.map((value, index) =>
                                    /* @__PURE__ */ jsx("circle", {
                                      cx: 20 + (index * 440) / Math.max(points.length - 1, 1),
                                      cy: 180 - (value / max) * 120,
                                      r: "4",
                                      fill: "#FBF7F0",
                                      stroke: "#7A2348",
                                      strokeWidth: "3"
                                    }, `${value}-${index}`)
                                  )
                                ]
                              }
                            )
                        }
                      )
                    ]
                  }
                ),

                /* @__PURE__ */ jsxs(
                  motion.div,
                  {
                    initial: {
                      opacity: 0,
                      y: 16
                    },

                    animate: {
                      opacity: 1,
                      y: 0
                    },

                    className:
                      "rounded-[28px] border border-[#5A1835] bg-white p-5 shadow-soft",

                    children: [
                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className:
                            "text-[10px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                          children:
                            "Expense breakdown"
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className:
                            "mt-1 font-display text-xl font-semibold text-[#7A2348]",

                          children:
                            "Where spend is going"
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className:
                            "mt-5",

                          children:
                            /* @__PURE__ */ jsx(
                              ExpenseDonut,
                              {
                                slices: expenseSlices,
                                totalExpenses,
                                loading: txnsLoading
                              }
                            )
                        }
                      )
                    ]
                  }
                )
              ]
            }
          ),

          /*
           * AI COPILOT
           */
          /* @__PURE__ */ jsxs(
            "section",
            {
              className:
                "mt-6",

              children: [
                /* @__PURE__ */ jsxs(
                  motion.div,
                  {
                    initial: {
                      opacity: 0,
                      y: 16
                    },

                    animate: {
                      opacity: 1,
                      y: 0
                    },

                    className:
                      "rounded-[30px] border border-[#5A1835] bg-gradient-to-br from-white to-[#F3E7D3] p-6 shadow-soft sm:p-8",

                    children: [
                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className:
                            "flex items-start gap-3",

                          children: [
                            /* @__PURE__ */ jsx(
                              "span",
                              {
                                className:
                                  "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#5A1835] to-[#7A2348] text-white",

                                children:
                                  /* @__PURE__ */ jsx(
                                    BrainCircuit,
                                    {
                                      className:
                                        "h-5 w-5"
                                    }
                                  )
                              }
                            ),

                            /* @__PURE__ */ jsxs(
                              "div",
                              {
                                children: [
                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "font-display text-lg font-semibold text-[#7A2348]",

                                      children:
                                        "Eva AI · Financial Copilot"
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "text-[12.5px] text-[#7A2348]/70",

                                      children:
                                        copilotLoading
                                          ? "Analyzing your finances…"
                                          : "Analyze your saved transaction data."
                                    }
                                  )
                                ]
                              }
                            )
                          ]
                        }
                      ),

                      copilotResponse
                        ? /* @__PURE__ */ jsxs(
                            "div",
                            {
                              className:
                                "mt-5 flex items-start gap-3 rounded-[20px] border border-[#5A1835] bg-[#F3E7D3] px-5 py-4",

                              children: [
                                /* @__PURE__ */ jsx(
                                  "span",
                                  {
                                    className:
                                      "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#7A2348] text-white",

                                    children:
                                      /* @__PURE__ */ jsx(
                                        Sparkles,
                                        {
                                          className:
                                            "h-4 w-4"
                                        }
                                      )
                                  }
                                ),

                                /* @__PURE__ */ jsx(
                                  "p",
                                  {
                                    className:
                                      "flex-1 text-[14px] leading-relaxed text-[#7A2348]",

                                    children:
                                      copilotResponse
                                  }
                                ),

                                /* @__PURE__ */ jsx(
                                  "button",
                                  {
                                    type: "button",

                                    onClick:
                                      () =>
                                        setCopilotResponse(
                                          null
                                        ),

                                    className:
                                      "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/70 text-[#7A2348] transition-colors hover:bg-white",

                                    "aria-label":
                                      "Close response",

                                    children:
                                      /* @__PURE__ */ jsx(
                                        X,
                                        {
                                          className:
                                            "h-3.5 w-3.5"
                                        }
                                      )
                                  }
                                )
                              ]
                            }
                          )
                        : /* @__PURE__ */ jsx(
                            "div",
                            {
                              className:
                                "mt-5 rounded-[20px] border border-[#5A1835] bg-white/60 p-5 text-[14px] leading-relaxed text-[#7A2348]/70",

                              children:
                                txns.length
                                  ? `Eva AI can analyze the ${txns.length} saved transaction${
                                      txns.length ===
                                      1
                                        ? ""
                                        : "s"
                                    }. Choose an action to generate insights from live data.`
                                  : "No saved transactions yet. Add an expense to generate financial insights."
                            }
                          ),

                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className:
                            "mt-5 flex flex-wrap gap-2.5",

                          children:
                            COPILOT_ACTIONS.map(
                              (action) =>
                                /* @__PURE__ */ jsx(
                                  "button",
                                  {
                                    type: "button",

                                    onClick:
                                      () =>
                                        handleCopilotAction(
                                          action
                                        ),

                                    disabled:
                                      copilotLoading,

                                    className:
                                      "rounded-full border border-[#5A1835] bg-white/70 px-4 py-2 text-[12.5px] font-semibold text-[#7A2348] transition-colors hover:border-[#7A2348] hover:bg-[#F3E7D3] disabled:opacity-50",

                                    children:
                                      copilotLoading &&
                                      activeAction ===
                                        action.label
                                        ? "Loading…"
                                        : action.label
                                  },
                                  action.label
                                )
                            )
                        }
                      )
                    ]
                  }
                ),

                /*
                 * LIVE INSIGHTS
                 */
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className:
                      "mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5",

                    children: [
                      {
                        icon: "₹",
                        label: `Total expenses: ${liveStats.totalExpenses}`
                      },
                      {
                        icon: "✓",
                        label: `Cleared: ${liveStats.clearedCount}`
                      },
                      {
                        icon: "⏳",
                        label: `Pending: ${liveStats.pendingCount}`
                      },
                      {
                        icon: "!",
                        label: `Overdue: ${liveStats.overdueCount}`
                      },
                      {
                        icon: "#",
                        label: `Categories: ${liveStats.categoryCount}`
                      }
                    ].map(
                      (insight) =>
                        /* @__PURE__ */ jsxs(
                          "div",
                          {
                            className:
                              "rounded-2xl border border-[#5A1835] bg-[#FBF7F0] px-3 py-2.5 text-[12.5px] text-[#7A2348] shadow-soft",

                            children: [
                              /* @__PURE__ */ jsx(
                                "span",
                                {
                                  className:
                                    "mr-1.5",

                                  children:
                                    insight.icon
                                }
                              ),

                              insight.label
                            ]
                          },
                          insight.label
                        )
                    )
                  }
                )
              ]
            }
          ),

          /*
           * TRANSACTIONS
           */
          /* @__PURE__ */ jsxs(
            "section",
            {
              className:
                "mt-6 rounded-[28px] border border-[#5A1835] bg-white p-5 shadow-soft",

              children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className:
                      "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",

                    children: [
                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          children: [
                            /* @__PURE__ */ jsx(
                              "p",
                              {
                                className:
                                  "text-[10px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                                children:
                                  "Recent transactions"
                              }
                            ),

                            /* @__PURE__ */ jsx(
                              "p",
                              {
                                className:
                                  "mt-1 font-display text-xl font-semibold text-[#7A2348]",

                                children:
                                  "Payment activity"
                              }
                            )
                          ]
                        }
                      ),

                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className:
                            "flex items-center gap-2 rounded-full border border-[#5A1835] bg-white px-4 py-2 shadow-soft",

                          children: [
                            /* @__PURE__ */ jsx(
                              Search,
                              {
                                className:
                                  "h-4 w-4 shrink-0 text-[#7A2348]/70"
                              }
                            ),

                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                value:
                                  searchQuery,

                                onChange: (
                                  e
                                ) =>
                                  setSearchQuery(
                                    e.target
                                      .value
                                  ),

                                placeholder:
                                  "Search vendor, event, invoice…",

                                className:
                                  "w-full bg-transparent text-[13px] text-[#7A2348] placeholder:text-[#7A2348]/50 focus:outline-none sm:w-56"
                              }
                            )
                          ]
                        }
                      )
                    ]
                  }
                ),

                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className:
                      "mt-3 flex flex-wrap items-center gap-2",

                    children: [
                      "All",
                      "Cleared",
                      "Pending",
                      "Overdue"
                    ].map(
                      (tab) =>
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            type: "button",

                            onClick:
                              () =>
                                setStatusFilter(
                                  tab
                                ),

                            className:
                              `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                                statusFilter ===
                                tab
                                  ? "bg-[#7A2348] text-white"
                                  : "border border-[#5A1835] bg-white text-[#7A2348] hover:bg-[#F3E7D3]"
                              }`,

                            children: [
                              tab,

                              /* @__PURE__ */ jsx(
                                "span",
                                {
                                  className:
                                    `rounded-full px-1.5 py-0.5 text-[10px] ${
                                      statusFilter ===
                                      tab
                                        ? "bg-white/20"
                                        : "bg-[#F3E7D3]"
                                    }`,

                                  children:
                                    txnCounts[
                                      tab
                                    ]
                                }
                              )
                            ]
                          },
                          tab
                        )
                    )
                  }
                ),

                /* @__PURE__ */ jsxs(
                  "p",
                  {
                    className:
                      "mt-3 text-[12px] text-[#7A2348]/70",

                    children: [
                      "Showing ",
                      filteredTxns.length,
                      " of ",
                      txns.length,
                      " transactions"
                    ]
                  }
                ),

                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className:
                      "mt-2 overflow-x-auto",

                    children:
                      /* @__PURE__ */ jsxs(
                        "table",
                        {
                          className:
                            "w-full min-w-[720px] border-collapse text-left text-[13px]",

                          children: [
                            /* @__PURE__ */ jsx(
                              "thead",
                              {
                                children:
                                  /* @__PURE__ */ jsxs(
                                    "tr",
                                    {
                                      className:
                                        "text-[11px] uppercase tracking-[0.1em] text-[#7A2348]/70",

                                      children: [
                                        /* @__PURE__ */ jsx(
                                          "th",
                                          {
                                            className:
                                              "pb-3 font-medium",
                                            children:
                                              "Vendor"
                                          }
                                        ),

                                        /* @__PURE__ */ jsx(
                                          "th",
                                          {
                                            className:
                                              "pb-3 font-medium",
                                            children:
                                              "Event"
                                          }
                                        ),

                                        /* @__PURE__ */ jsx(
                                          "th",
                                          {
                                            className:
                                              "pb-3 font-medium",
                                            children:
                                              "Category"
                                          }
                                        ),

                                        /* @__PURE__ */ jsx(
                                          "th",
                                          {
                                            className:
                                              "pb-3 font-medium",
                                            children:
                                              "Invoice"
                                          }
                                        ),

                                        /* @__PURE__ */ jsx(
                                          "th",
                                          {
                                            className:
                                              "pb-3 font-medium",
                                            children:
                                              "Amount"
                                          }
                                        ),

                                        /* @__PURE__ */ jsx(
                                          "th",
                                          {
                                            className:
                                              "pb-3 font-medium",
                                            children:
                                              "Method"
                                          }
                                        ),

                                        /* @__PURE__ */ jsx(
                                          "th",
                                          {
                                            className:
                                              "pb-3 font-medium",
                                            children:
                                              "Status"
                                          }
                                        ),

                                        /* @__PURE__ */ jsx(
                                          "th",
                                          {
                                            className:
                                              "pb-3 font-medium",
                                            children:
                                              "Actions"
                                          }
                                        )
                                      ]
                                    }
                                  )
                              }
                            ),

                            /* @__PURE__ */ jsx(
                              "tbody",
                              {
                                children:
                                  filteredTxns.length ===
                                  0
                                    ? /* @__PURE__ */ jsx(
                                        "tr",
                                        {
                                          children:
                                            /* @__PURE__ */ jsx(
                                              "td",
                                              {
                                                colSpan: 8,

                                                className:
                                                  "py-12 text-center text-[13px] text-[#7A2348]/70",

                                                children:
                                                  "No transactions found. Add an expense or adjust your search/filter."
                                              }
                                            )
                                        }
                                      )
                                    : filteredTxns.map(
                                        (
                                          txn,
                                          idx
                                        ) =>
                                          /* @__PURE__ */ jsxs(
                                            "tr",
                                            {
                                              className:
                                                "group border-t border-[#5A1835] transition-colors hover:bg-[#FBF7F0]",

                                              children: [
                                                /* @__PURE__ */ jsx(
                                                  "td",
                                                  {
                                                    className:
                                                      "py-3 pr-3",

                                                    children:
                                                      /* @__PURE__ */ jsxs(
                                                        "div",
                                                        {
                                                          className:
                                                            "flex items-center gap-2.5",

                                                          children: [
                                                            /* @__PURE__ */ jsx(
                                                              "span",
                                                              {
                                                                className:
                                                                  "grid h-8 w-8 place-items-center rounded-full bg-[#7A2348] text-[10px] font-semibold text-white",

                                                                children:
                                                                  (
                                                                    txn.vendor ||
                                                                    "??"
                                                                  )
                                                                    .slice(
                                                                      0,
                                                                      2
                                                                    )
                                                                    .toUpperCase()
                                                              }
                                                            ),

                                                            /* @__PURE__ */ jsx(
                                                              "span",
                                                              {
                                                                className:
                                                                  "font-semibold text-[#7A2348]",

                                                                children:
                                                                  txn.vendor ||
                                                                  "Unnamed vendor"
                                                              }
                                                            )
                                                          ]
                                                        }
                                                      )
                                                  }
                                                ),

                                                /* @__PURE__ */ jsx(
                                                  "td",
                                                  {
                                                    className:
                                                      "py-3 pr-3 text-[#7A2348]/70",

                                                    children:
                                                      txn.event ||
                                                      "—"
                                                  }
                                                ),

                                                /* @__PURE__ */ jsx(
                                                  "td",
                                                  {
                                                    className:
                                                      "py-3 pr-3 text-[#7A2348]/70",

                                                    children:
                                                      txn.category ||
                                                      "Uncategorized"
                                                  }
                                                ),

                                                /* @__PURE__ */ jsx(
                                                  "td",
                                                  {
                                                    className:
                                                      "py-3 pr-3 text-[#7A2348]/70",

                                                    children:
                                                      txn.invoice ||
                                                      "—"
                                                  }
                                                ),

                                                /* @__PURE__ */ jsx(
                                                  "td",
                                                  {
                                                    className:
                                                      "py-3 pr-3 font-semibold text-[#7A2348]",

                                                    children:
                                                      txn.amount
                                                  }
                                                ),

                                                /* @__PURE__ */ jsx(
                                                  "td",
                                                  {
                                                    className:
                                                      "py-3 pr-3 text-[#7A2348]/70",

                                                    children:
                                                      txn.method ||
                                                      "—"
                                                  }
                                                ),

                                                /* @__PURE__ */ jsx(
                                                  "td",
                                                  {
                                                    className:
                                                      "py-3 pr-3",

                                                    children:
                                                      /* @__PURE__ */ jsx(
                                                        "span",
                                                        {
                                                          className:
                                                            `rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                              statusTone[
                                                                txn.status
                                                              ] ||
                                                              fallbackTone
                                                            }`,

                                                          children:
                                                            txn.status ||
                                                            "Unknown"
                                                        }
                                                      )
                                                  }
                                                ),

                                                /* @__PURE__ */ jsx(
                                                  "td",
                                                  {
                                                    className:
                                                      "py-3",

                                                    children:
                                                      /* @__PURE__ */ jsxs(
                                                        "div",
                                                        {
                                                          className:
                                                            "flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100",

                                                          children: [
                                                            /* @__PURE__ */ jsx(
                                                              "button",
                                                              {
                                                                type: "button",

                                                                onClick:
                                                                  () =>
                                                                    toast(
                                                                      {
                                                                        title:
                                                                          "Invoice downloaded",

                                                                        description:
                                                                          (txn.vendor ||
                                                                            "Unknown") +
                                                                          " — " +
                                                                          (txn.invoice ||
                                                                            "No invoice")
                                                                      }
                                                                    ),

                                                                className:
                                                                  "rounded-full border border-[#5A1835] bg-white p-1.5 text-[#7A2348] transition-colors hover:bg-[#F3E7D3]",

                                                                "aria-label":
                                                                  "Download invoice",

                                                                children:
                                                                  /* @__PURE__ */ jsx(
                                                                    Download,
                                                                    {
                                                                      className:
                                                                        "h-3.5 w-3.5"
                                                                    }
                                                                  )
                                                              }
                                                            ),

                                                            /* @__PURE__ */ jsx(
                                                              "button",
                                                              {
                                                                type: "button",

                                                                onClick:
                                                                  () =>
                                                                    toast(
                                                                      {
                                                                        title:
                                                                          txn.vendor ||
                                                                          "Transaction",

                                                                        description:
                                                                          (txn.event ||
                                                                            "No event") +
                                                                          " · " +
                                                                          txn.amount +
                                                                          " · " +
                                                                          (txn.status ||
                                                                            "Unknown")
                                                                      }
                                                                    ),

                                                                className:
                                                                  "rounded-full border border-[#5A1835] bg-white p-1.5 text-[#7A2348] transition-colors hover:bg-[#F3E7D3]",

                                                                "aria-label":
                                                                  "View details",

                                                                children:
                                                                  /* @__PURE__ */ jsx(
                                                                    ChevronRight,
                                                                    {
                                                                      className:
                                                                        "h-3.5 w-3.5"
                                                                    }
                                                                  )
                                                              }
                                                            )
                                                          ]
                                                        }
                                                      )
                                                  }
                                                )
                                              ]
                                            },
                                            txn.invoice ||
                                              idx
                                          )
                                      )
                              }
                            )
                          ]
                        }
                      )
                  }
                )
              ]
            }
          ),

          /*
           * UPCOMING PAYMENTS
           */
          /* @__PURE__ */ jsxs(
            "section",
            {
              className:
                "mt-6",

              children: [
                /* @__PURE__ */ jsx(
                  "p",
                  {
                    className:
                      "text-[10px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                    children:
                      "Upcoming payments"
                  }
                ),

                /* @__PURE__ */ jsx(
                  "p",
                  {
                    className:
                      "mt-1 font-display text-xl font-semibold text-[#7A2348]",

                    children:
                      "Vendors waiting on payout"
                  }
                ),

                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className:
                      "mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4",

                    children:
                      upcomingPayments.length
                        ? upcomingPayments
                        .map((payment) => ({
                          ...payment,

                          initials:
                            (
                              payment.vendor ||
                              "??"
                            )
                              .slice(
                                0,
                                2
                              )
                              .toUpperCase(),

                          due: payment.due_date || payment.status
                        }))
                        .map(
                          (payment) =>
                            /* @__PURE__ */ jsxs(
                              motion.div,
                              {
                                whileHover: {
                                  y: -3
                                },

                                className:
                                  "rounded-[24px] border border-[#5A1835] bg-white p-5 shadow-soft",

                                children: [
                                  /* @__PURE__ */ jsxs(
                                    "div",
                                    {
                                      className:
                                        "flex items-center gap-3",

                                      children: [
                                        /* @__PURE__ */ jsx(
                                          "span",
                                          {
                                            className:
                                              "grid h-11 w-11 place-items-center rounded-2xl bg-[#F3E7D3] text-[12px] font-semibold text-[#7A2348] ring-1 ring-inset ring-[#5A1835]",

                                            children:
                                              payment.initials
                                          }
                                        ),

                                        /* @__PURE__ */ jsxs(
                                          "div",
                                          {
                                            children: [
                                              /* @__PURE__ */ jsx(
                                                "p",
                                                {
                                                  className:
                                                    "font-semibold text-[#7A2348]",

                                                    children:
                                                      payment.vendor ||
                                                      "Unnamed vendor"
                                                }
                                              ),

                                              /* @__PURE__ */ jsx(
                                                "p",
                                                {
                                                  className:
                                                    "text-[12px] text-[#7A2348]/70",

                                                  children:
                                                    payment.due
                                                }
                                              )
                                            ]
                                          }
                                        )
                                      ]
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "mt-4 font-display text-xl font-semibold text-[#7A2348]",

                                      children:
                                        payment.amount
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "span",
                                    {
                                      className:
                                        `mt-2 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                          priorityTone[
                                            payment.priority
                                          ] ||
                                          fallbackTone
                                        }`,

                                      children:
                                        payment.priority
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "button",
                                    {
                                      type: "button",

                                      onClick:
                                        () =>
                                          handlePayNow(
                                            payment
                                          ),

                                      className:
                                        "mt-4 w-full rounded-full bg-[#7A2348] py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#5A1835]",

                                      children:
                                        "Pay Now"
                                    }
                                  )
                                ]
                              },
                              payment.id
                            )
                        )
                        : /* @__PURE__ */ jsx("div", {
                            className:
                              "col-span-full rounded-[20px] border border-dashed border-[#5A1835] bg-[#FBF7F0] p-8 text-center text-[13px] text-[#7A2348]/70",
                            children: "No upcoming payments"
                          })
                  }
                )
              ]
            }
          ),

          /*
           * BOTTOM SUMMARY
           */
          /* @__PURE__ */ jsxs(
            "section",
            {
              className:
                "mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]",

              children: [
                /*
                 * LIVE SUMMARY
                 */
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className:
                      "rounded-[28px] border border-[#5A1835] bg-white p-5 shadow-soft",

                    children: [
                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className:
                            "text-[10px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                          children:
                            "Financial summary"
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className:
                            "mt-1 font-display text-xl font-semibold text-[#7A2348]",

                          children:
                            "Current transaction position"
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className:
                            "mt-5 space-y-4",

                          children: [
                            {
                              label:
                                "Total expenses",

                              value:
                                totalExpenses,

                              amount:
                                txnsLoading
                                  ? "Loading…"
                                  : formatMoney(totalExpenses),

                              color:
                                "bg-[#7A2348]"
                            }
                          ].map(
                            (bar) =>
                              /* @__PURE__ */ jsxs(
                                "div",
                                {
                                  children: [
                                    /* @__PURE__ */ jsxs(
                                      "div",
                                      {
                                        className:
                                          "mb-1.5 flex items-center justify-between text-[12.5px]",

                                        children: [
                                          /* @__PURE__ */ jsx(
                                            "span",
                                            {
                                              className:
                                                "text-[#7A2348]/70",

                                              children:
                                                bar.label
                                            }
                                          ),

                                          /* @__PURE__ */ jsx(
                                            "span",
                                            {
                                              className:
                                                "font-semibold text-[#7A2348]",

                                              children:
                                                bar.amount
                                            }
                                          )
                                        ]
                                      }
                                    ),

                                    /* @__PURE__ */ jsx(
                                      "div",
                                      {
                                        className:
                                          "h-2.5 rounded-full bg-[#F3E7D3]",

                                        children:
                                          /* @__PURE__ */ jsx(
                                            motion.div,
                                            {
                                              initial:
                                                {
                                                  width: 0
                                                },

                                              animate:
                                                {
                                                  width:
                                                    totalExpenses
                                                      ? "100%"
                                                      : "0%"
                                                },

                                              transition:
                                                {
                                                  duration:
                                                    0.5
                                                },

                                              className:
                                                "h-2.5 rounded-full bg-[#7A2348]"
                                            }
                                          )
                                      }
                                    )
                                  ]
                                },
                                bar.label
                              )
                          )
                        }
                      ),

                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className:
                            "mt-6 grid grid-cols-2 gap-3",

                          children: [
                            /* @__PURE__ */ jsxs(
                              "div",
                              {
                                className:
                                  "rounded-[18px] bg-[#F3E7D3] p-4 text-[#7A2348]",

                                children: [
                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "text-[11px] uppercase tracking-[0.16em]",

                                      children:
                                        "Cleared"
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "mt-2 font-display text-xl font-semibold",

                                      children:
                                        liveStats.clearedAmount
                                    }
                                  )
                                ]
                              }
                            ),

                            /* @__PURE__ */ jsxs(
                              "div",
                              {
                                className:
                                  "rounded-[18px] bg-[#F3E7D3] p-4 text-[#7A2348]",

                                children: [
                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "text-[11px] uppercase tracking-[0.16em]",

                                      children:
                                        "Pending"
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "mt-2 font-display text-xl font-semibold",

                                      children:
                                        liveStats.pendingAmount
                                    }
                                  )
                                ]
                              }
                            ),

                            /* @__PURE__ */ jsxs(
                              "div",
                              {
                                className:
                                  "rounded-[18px] bg-[#F3E7D3] p-4 text-[#7A2348]",

                                children: [
                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "text-[11px] uppercase tracking-[0.16em]",

                                      children:
                                        "Overdue"
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "mt-2 font-display text-xl font-semibold",

                                      children:
                                        liveStats.overdueAmount
                                    }
                                  )
                                ]
                              }
                            ),

                            /* @__PURE__ */ jsxs(
                              "div",
                              {
                                className:
                                  "rounded-[18px] bg-[#F3E7D3] p-4 text-[#7A2348]",

                                children: [
                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "text-[11px] uppercase tracking-[0.16em]",

                                      children:
                                        "Categories"
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "mt-2 font-display text-xl font-semibold",

                                      children:
                                        liveStats.categoryCount
                                    }
                                  )
                                ]
                              }
                            )
                          ]
                        }
                      )
                    ]
                  }
                ),

                /*
                 * SMART ALERTS
                 */
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className:
                      "rounded-[28px] border border-[#5A1835] bg-white p-5 shadow-soft",

                    children: [
                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className:
                            "flex items-center justify-between",

                          children: [
                            /* @__PURE__ */ jsxs(
                              "div",
                              {
                                children: [
                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "text-[10px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                                      children:
                                        "Smart alerts"
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "mt-1 font-display text-xl font-semibold text-[#7A2348]",

                                      children:
                                        "Payment attention"
                                    }
                                  )
                                ]
                              }
                            ),

                            /* @__PURE__ */ jsxs(
                              "span",
                              {
                                className:
                                  "rounded-full bg-[#F3E7D3] px-3 py-1 text-[11px] font-semibold text-[#7A2348]",

                                children: [
                                  visibleAlerts.length,
                                  " alerts"
                                ]
                              }
                            )
                          ]
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className:
                            "mt-4 space-y-3",

                          children:
                            visibleAlerts.length
                              ? visibleAlerts.map(
                                  (
                                    alert
                                  ) =>
                                    /* @__PURE__ */ jsxs(
                                      "div",
                                      {
                                        className:
                                          "rounded-[18px] border border-[#5A1835] bg-[#FBF7F0] p-3",

                                        children: [
                                          /* @__PURE__ */ jsxs(
                                            "div",
                                            {
                                              className:
                                                "flex items-start justify-between gap-3",

                                              children: [
                                                /* @__PURE__ */ jsxs(
                                                  "div",
                                                  {
                                                    children: [
                                                      /* @__PURE__ */ jsx(
                                                        "p",
                                                        {
                                                          className:
                                                            "font-semibold text-[#7A2348]",

                                                          children:
                                                            alert.label
                                                        }
                                                      ),

                                                      /* @__PURE__ */ jsx(
                                                        "p",
                                                        {
                                                          className:
                                                            "mt-1 text-[12px] text-[#7A2348]/70",

                                                          children:
                                                            alert.detail
                                                        }
                                                      )
                                                    ]
                                                  }
                                                ),

                                                /* @__PURE__ */ jsx(
                                                  "span",
                                                  {
                                                    className:
                                                      "shrink-0 rounded-full bg-[#F3E7D3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A2348]",

                                                    children:
                                                      alert.severity
                                                  }
                                                )
                                              ]
                                            }
                                          ),

                                          /* @__PURE__ */ jsx(
                                            "button",
                                            {
                                              type: "button",

                                              onClick:
                                                () =>
                                                  setDismissedAlerts(
                                                    (
                                                      prev
                                                    ) =>
                                                      new Set(
                                                        [
                                                          ...prev,
                                                          alert.index
                                                        ]
                                                      )
                                                  ),

                                              className:
                                                "mt-3 rounded-full border border-[#5A1835] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#7A2348] transition-colors hover:bg-[#F3E7D3]",

                                              children:
                                                "Resolve"
                                            }
                                          )
                                        ]
                                      },
                                      alert.index
                                    )
                                )
                              : /* @__PURE__ */ jsx(
                                  "div",
                                  {
                                    className:
                                      "rounded-[18px] border border-dashed border-[#5A1835] bg-[#FBF7F0] p-6 text-center text-[13px] text-[#7A2348]/70",

                                    children:
                                      "No payment attention needed"
                                  }
                                )
                        }
                      )
                    ]
                  }
                )
              ]
            }
          ),

          /*
           * OUTLOOK + HEALTH
           */
          /* @__PURE__ */ jsxs(
            "section",
            {
              className:
                "mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]",

              children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className:
                      "rounded-[28px] border border-[#5A1835] bg-white p-5 shadow-soft",

                    children: [
                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className:
                            "text-[10px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                          children:
                            "Live overview"
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "p",
                        {
                          className:
                            "mt-1 font-display text-xl font-semibold text-[#7A2348]",

                          children:
                            "Current account position"
                        }
                      ),

                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className:
                            "mt-5 grid gap-3 sm:grid-cols-2",

                          children: [
                            {
                              label:
                                "Saved transactions",

                              value:
                                String(
                                  txns.length
                                )
                            },

                            {
                              label:
                                "Pending",

                              value:
                                String(
                                  pendingTxns.length
                                )
                            },

                            {
                              label:
                                "Overdue",

                              value:
                                String(
                                  overdueTxns.length
                                )
                            },

                            {
                              label:
                                "Categories",

                              value:
                                String(
                                  liveStats.categoryCount
                                )
                            }
                          ].map(
                            (tile) =>
                              /* @__PURE__ */ jsxs(
                                "div",
                                {
                                  className:
                                    "rounded-[18px] bg-[#F3E7D3] p-4 text-[#7A2348]",

                                  children: [
                                    /* @__PURE__ */ jsx(
                                      "p",
                                      {
                                        className:
                                          "text-[11px] uppercase tracking-[0.16em]",

                                        children:
                                          tile.label
                                      }
                                    ),

                                    /* @__PURE__ */ jsx(
                                      "p",
                                      {
                                        className:
                                          "mt-2 font-display text-2xl font-semibold",

                                        children:
                                          tile.value
                                      }
                                    )
                                  ]
                                },
                                tile.label
                              )
                          )
                        }
                      )
                    ]
                  }
                ),

                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className:
                      "rounded-[28px] border border-[#5A1835] bg-white p-5 shadow-soft",

                    children: [
                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className:
                            "flex items-center justify-between",

                          children: [
                            /* @__PURE__ */ jsxs(
                              "div",
                              {
                                children: [
                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "text-[10px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                                      children:
                                        "Financial health"
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className:
                                        "mt-1 font-display text-xl font-semibold text-[#7A2348]",

                                      children:
                                        "Transaction Health"
                                    }
                                  )
                                ]
                              }
                            ),

                            /* @__PURE__ */ jsx(
                              "span",
                              {
                                className:
                                  "rounded-full border border-[#5A1835] bg-[#F3E7D3] px-3 py-1 text-[12px] font-semibold text-[#7A2348]",

                                children:
                                  "Live Data"
                              }
                            )
                          ]
                        }
                      ),

                      /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className:
                            "mt-5 flex flex-col gap-5 rounded-[20px] border border-[#5A1835] bg-[#FBF7F0] p-5 sm:flex-row sm:items-center",

                          children: [
                            /* @__PURE__ */ jsx(
                              "div",
                              {
                                className:
                                  "relative grid h-28 w-28 shrink-0 place-items-center rounded-full",
                                style: {
                                  background: txnsLoading
                                    ? "#F3E7D3"
                                    : `conic-gradient(#7A2348 ${txns.length ? financialMetrics.healthScore : 0}%, #F3E7D3 ${txns.length ? financialMetrics.healthScore : 0}% 100%)`
                                },

                                children:
                                  /* @__PURE__ */ jsx(
                                    "div",
                                    {
                                      className:
                                        "grid h-[5.5rem] w-[5.5rem] place-items-center rounded-full bg-white",

                                      children:
                                        /* @__PURE__ */ jsxs(
                                          "div",
                                          {
                                            children: [
                                              /* @__PURE__ */ jsx(
                                                "p",
                                                {
                                                  className:
                                                    "text-[11px] uppercase tracking-[0.16em] text-[#7A2348]/70",

                                                  children:
                                                    "HEALTH"
                                                }
                                              ),

                                              /* @__PURE__ */ jsx(
                                                "p",
                                                {
                                                  className:
                                                    "mt-1 font-display text-2xl font-semibold text-[#7A2348]",

                                                  children:
                                                    txnsLoading
                                                      ? "Loading…"
                                                      : txns.length
                                                        ? financialMetrics.healthScore
                                                        : "Not enough data"
                                                }
                                              )
                                            ]
                                          }
                                        )
                                    }
                                  )
                              }
                            ),

                            /* @__PURE__ */ jsxs(
                              "div",
                              {
                                className:
                                  "min-w-0 space-y-2 text-left text-[13px] leading-relaxed text-[#7A2348]/70",

                                children: [
                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      className: "font-medium text-[#7A2348]",
                                      children:
                                        financialMetrics.healthExplanation
                                    }
                                  ),

                                  /* @__PURE__ */ jsx(
                                    "p",
                                    {
                                      children:
                                        "Based on overdue, pending, and cleared transaction totals."
                                    }
                                  )
                                ]
                              }
                            )
                          ]
                        }
                      )
                    ]
                  }
                )
              ]
            }
          ),

          /* @__PURE__ */ jsx(
            AddExpenseModal,
            {
              open:
                showAddModal,

              onClose: () =>
                setShowAddModal(
                  false
                ),

              onAdd:
                handleAddExpense
            }
          )
        ]
      }
    );

  return isVendor
    ? /* @__PURE__ */ jsx(VendorLayout, { children: pageBody })
    : /* @__PURE__ */ jsx(AdminLayout, { children: pageBody });
}