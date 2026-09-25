import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const plans = [
  {
    id: "studio",
    n: "Studio",
    p: "₹ 7,900",
    amountInRupees: 7900,
    s: "/mo",
    d: "For boutique event teams starting to scale.",
    f: [
      "Up to 5 seats",
      "Unlimited marketplace access",
      "Financial Tracker (10 events)",
      "Email support",
    ],
  },
  {
    id: "atelier",
    n: "Atelier",
    p: "₹ 18,900",
    amountInRupees: 18900,
    s: "/mo",
    d: "For growing companies running many events in parallel.",
    f: [
      "Up to 20 seats",
      "Advanced analytics & reports",
      "Unlimited events & vendors",
      "Priority onboarding",
    ],
    hot: true,
  },
  {
    id: "maison",
    n: "Maison",
    p: "Custom",
    amountInRupees: null,
    s: "",
    d: "For enterprise groups with bespoke workflows.",
    f: [
      "Unlimited seats",
      "SLAs, SSO, audit logs",
      "Dedicated success manager",
      "Custom integrations",
    ],
  },
];

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSelectPlan = async (plan) => {
    // Enterprise / Custom plan -> Talk to Sales
    if (plan.id === "maison" || !plan.amountInRupees) {
      navigate("/contact");
      return;
    }

    // Require authentication
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in or register to subscribe to a plan.",
      });
      navigate("/login?redirect=/pricing");
      return;
    }

    // Check if Razorpay SDK script is loaded
    if (!window.Razorpay) {
      toast({
        title: "Payment Widget Loading",
        description: "Razorpay payment checkout is loading. Please check your internet connection and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoadingPlan(plan.id);

    try {
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TfZ7UGMNWvCHif";
      const amountInPaise = plan.amountInRupees * 100;

      const options = {
        key: razorpayKey,
        amount: amountInPaise,
        currency: "INR",
        name: "evenTneve",
        description: `${plan.n} Plan Subscription`,
        image: "/favicon.ico",
        prefill: {
          name: user?.full_name || user?.fullName || "",
          email: user?.email || "",
        },
        theme: {
          color: "#7A2348",
        },
        handler: function (response) {
          setLoadingPlan(null);
          toast({
            title: "Subscription Successful! 🎉",
            description: `Payment complete (${response.razorpay_payment_id}). Your ${plan.n} subscription is now active!`,
          });
          navigate("/dashboard");
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setLoadingPlan(null);
        toast({
          title: "Payment Failed",
          description: resp?.error?.description || "Payment could not be processed. Please try again.",
          variant: "destructive",
        });
      });

      rzp.open();
    } catch (err) {
      setLoadingPlan(null);
      toast({
        title: "Checkout Error",
        description: err.message || "Failed to launch payment gateway",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A2348] dark:text-[#C4547A]">
          Pricing
        </p>

        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-espresso sm:text-5xl">
          Pricing that scales with your calendar.
        </h1>

        <p className="mt-4 text-[15.5px] leading-relaxed text-taupe">
          Start with a 14-day free trial. Cancel anytime. No hidden fees.
        </p>
      </header>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.n}
            className={`relative flex flex-col rounded-[26px] border p-7 shadow-soft transition-all duration-300 ${
              p.hot
                ? "border-[#7A2348] bg-gradient-to-b from-[#7A2348] to-[#5E1836] text-[#FFFDF8] shadow-luxe"
                : "border-border bg-card text-espresso"
            }`}
          >
            {p.hot && (
              <span className="absolute -top-3 left-7 rounded-full bg-[#E8C7CF] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A2348] shadow-sm">
                Most popular
              </span>
            )}

            <p
              className={`text-[11px] uppercase tracking-[0.16em] ${
                p.hot ? "text-[#E8C7CF]" : "text-taupe"
              }`}
            >
              {p.n}
            </p>

            <p className="mt-4 flex items-end gap-1 font-display text-4xl font-bold tracking-tight">
              {p.p}

              <span
                className={`text-sm font-medium ${
                  p.hot ? "text-[#FFFDF8]/60" : "text-taupe"
                }`}
              >
                {p.s}
              </span>
            </p>

            <p
              className={`mt-2 text-[13.5px] ${
                p.hot ? "text-[#FFFDF8]/70" : "text-taupe"
              }`}
            >
              {p.d}
            </p>

            <ul className="mt-6 space-y-3">
              {p.f.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-[13.5px]"
                >
                  <CheckCircle2
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      p.hot ? "text-[#E8C7CF]" : "text-[#7A2348] dark:text-[#C4547A]"
                    }`}
                  />

                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => handleSelectPlan(p)}
              disabled={loadingPlan === p.id}
              className={`mt-8 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-[13.5px] font-semibold transition-all duration-300 ${
                p.hot
                  ? "bg-[#E8C7CF] text-[#7A2348] hover:bg-[#F3E7D3] hover:shadow-float active:scale-[0.98]"
                  : "border border-border bg-[#7A2348] text-white hover:bg-[#641B3B] hover:shadow-float active:scale-[0.98]"
              }`}
            >
              {loadingPlan === p.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {p.n === "Maison" ? (
                    "Talk to sales"
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get Subscription
                    </>
                  )}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}