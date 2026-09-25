import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const plans = [
  {
    n: "Studio",
    p: "₹ 7,900",
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
    n: "Atelier",
    p: "₹ 18,900",
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
    n: "Maison",
    p: "Custom",
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
  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 pt-10">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A2348]">
          Pricing
        </p>

        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-[#292525] sm:text-5xl">
          Pricing that scales with your calendar.
        </h1>

        <p className="mt-4 text-[15.5px] leading-relaxed text-[#6F6265]">
          Start with a 14-day free trial. Cancel anytime. No hidden fees.
        </p>
      </header>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.n}
            className={`relative flex flex-col rounded-[26px] border p-7 shadow-soft ${
              p.hot
                ? "border-[#7A2348] bg-gradient-to-b from-[#7A2348] to-[#5E1836] text-[#FFFDF8] shadow-luxe"
                : "border-[#E8C7CF] bg-[#FFFDF8] text-[#292525]"
            }`}
          >
            {p.hot && (
              <span className="absolute -top-3 left-7 rounded-full bg-[#E8C7CF] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A2348] shadow-sm">
                Most popular
              </span>
            )}

            <p
              className={`text-[11px] uppercase tracking-[0.16em] ${
                p.hot ? "text-[#E8C7CF]" : "text-[#6F6265]"
              }`}
            >
              {p.n}
            </p>

            <p className="mt-4 flex items-end gap-1 font-display text-4xl font-bold tracking-tight">
              {p.p}

              <span
                className={`text-sm font-medium ${
                  p.hot ? "text-[#FFFDF8]/60" : "text-[#6F6265]"
                }`}
              >
                {p.s}
              </span>
            </p>

            <p
              className={`mt-2 text-[13.5px] ${
                p.hot ? "text-[#FFFDF8]/70" : "text-[#6F6265]"
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
                      p.hot ? "text-[#E8C7CF]" : "text-[#7A2348]"
                    }`}
                  />

                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/contact"
              className={`mt-8 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-[13.5px] font-semibold transition-all ${
                p.hot
                  ? "bg-[#E8C7CF] text-[#7A2348] hover:bg-[#F3E7D3]"
                  : "border border-[#E8C7CF] bg-[#F3E7D3] text-[#7A2348] hover:bg-[#E8C7CF]"
              }`}
            >
              {p.n === "Maison" ? "Talk to sales" : "Start free trial"}

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}