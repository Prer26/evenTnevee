import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Search,
  Star,
  MapPin,
  Sparkles,
  Wallet,
  Users,
  BadgeCheck,
  ChevronRight,
  CheckCircle2,
  Plus,
  Minus,
  Clock,
  PlayCircle,
  TrendingUp,
  ArrowUpRight,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { HeroScene } from "../components/site/HeroScene";
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: "easeOut" }
  })
};
function Reveal({
  children,
  className = "",
  i = 0
}) {
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      className,
      variants: fadeUp,
      custom: i,
      initial: "hidden",
      whileInView: "show",
      viewport: { once: true, margin: "-80px" },
      children
    }
  );
}
function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    const initial = 0;
    const animate = (time) => {
      const progress = Math.min((time - start) / duration, 1);
      const current = initial + (value - initial) * progress;
      setCount(Number(current.toFixed(decimals)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, decimals]);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    prefix,
    count.toLocaleString(void 0, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }),
    suffix
  ] });
}
export default function Landing() {
  return /* @__PURE__ */ jsxs("div", { className: "overflow-hidden bg-[#F3E7D3]", children: [
    /* @__PURE__ */ jsx(Hero, {}),
    /* @__PURE__ */ jsx(DashboardKPIs, {}),
    /* @__PURE__ */ jsx(TrustedMarquee, {}),
    /* @__PURE__ */ jsx(MarketplacePreview, {}),
    /* @__PURE__ */ jsx(PopularCategories, {}),
    /* @__PURE__ */ jsx(FinancialTrackerPreview, {}),
    /* @__PURE__ */ jsx(Testimonials, {}),
    /* @__PURE__ */ jsx(FAQ, {}),
    /* @__PURE__ */ jsx(CTA, {})
  ] });
}
function Hero() {
  const { user } = useAuth();
  const isVendor = user?.account_type === "vendor";
  const categories = ["Vendor OS", "AI Match", "Finance", "Ops", "Client CRM"];
  return /* @__PURE__ */ jsxs("section", { className: "relative overflow-visible pb-28 pt-10 sm:pt-14 lg:pb-36 lg:pt-16", children: [
    /* @__PURE__ */ jsxs("div", { className: "pointer-events-none absolute inset-0 -z-10", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-0 h-[620px] w-[1100px] -translate-x-1/2 rounded-full bg-[#F3E7D3]" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-8 h-[430px] bg-[#F3E7D3]" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[1fr_1.35fr] lg:gap-12 xl:px-8", children: [
      /* @__PURE__ */ jsxs(
        motion.div,
        {
          className: "mx-auto max-w-xl lg:mx-0",
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: "easeOut" },
          children: [
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-taupe shadow-soft backdrop-blur", children: [
              /* @__PURE__ */ jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-champagne" }),
              "Premium AI operating system for event teams"
            ] }),
            /* @__PURE__ */ jsxs("h1", { className: "mt-7 text-[clamp(2.8rem,4.8vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-espresso sm:text-[3.5rem] lg:text-[4.35rem]", children: [
              "The elegant way to run",
              /* @__PURE__ */ jsx("span", { className: "block text-gold-gradient dark:text-[#FFFDF8]", children: "high-stakes events." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-7 max-w-xl text-[16px] leading-relaxed text-taupe sm:text-[17px]", children: "Discover premium vendors, automate approvals, track finances, and keep every client experience beautifully organized in one calm workspace." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-9 flex flex-wrap items-center gap-3", children: [
              /* @__PURE__ */ jsxs(
                Link,
                {
                  to: isVendor ? "/vendor-dashboard" : "/marketplace",
                  className: "group inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--champagne),var(--bronze))] px-6 py-3.5 text-[14px] font-semibold text-ivory shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float active:scale-[0.98]",
                  children: [
                    isVendor ? "Go to My Listing" : "Explore Marketplace",
                    /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                Link,
                {
                  to: isVendor ? "/vendor-requests" : "/contact",
                  className: "inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/75 px-6 py-3.5 text-[14px] font-semibold text-espresso shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-luxe",
                  children: isVendor ? "View Requests" : "Book Demo"
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-9 flex flex-wrap gap-2", children: categories.map((item) => {
              const promptMap = {
                "Vendor OS": "I need help managing my vendors. What are the best practices for vendor coordination, contracts, and performance tracking?",
                "AI Match": "Use AI to help me find the perfect vendors for my upcoming event. What should I consider when matching vendors to event needs?",
                "Finance": "Help me with event financial management — budgeting, expense tracking, payment scheduling, and cost optimization.",
                "Ops": "I need help with event operations — logistics, timelines, team coordination, and execution management.",
                "Client CRM": "Help me with client management — communication, expectations, follow-ups, and building strong client relationships."
              };
              return /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => window.dispatchEvent(new CustomEvent("nova-open", { detail: { prompt: promptMap[item] } })),
                  className: "rounded-full border border-white/80 bg-white/70 px-3.5 py-2 text-[12px] font-medium text-espresso shadow-soft backdrop-blur transition-all duration-300 hover:border-champagne hover:bg-[#fefaf4] hover:shadow-luxe",
                  children: item
                },
                item
              );
            }) })
          ]
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "relative flex min-h-[560px] items-center justify-center lg:min-h-[640px] lg:justify-center", children: /* @__PURE__ */ jsx(HeroScene, {}) })
    ] })
  ] });
}
const dashboardContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 }
  }
};
const dashboardItem = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: "easeOut" }
  }
};
function FloatingSparkle({ className = "" }) {
  return /* @__PURE__ */ jsx(
    Sparkles,
    {
      className: `pointer-events-none absolute h-3.5 w-3.5 text-champagne opacity-50 animate-pulse ${className}`
    }
  );
}
function DashboardKPIs() {
  return /* @__PURE__ */ jsx("section", { className: "relative w-full px-6 pb-10 -mt-16 sm:pb-16", children:
    /* @__PURE__ */ jsx("div", { className: "relative mx-auto max-w-7xl", children:
      /* @__PURE__ */ jsxs("div", { className: "rounded-[28px] border border-[rgba(209,186,159,0.35)] bg-[linear-gradient(150deg,rgba(250,247,243,0.95),rgba(244,233,214,0.6))] p-7 shadow-float backdrop-blur-xl sm:p-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.16em] text-taupe", children: "Live Eventneve Data" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-2 font-display text-3xl font-bold text-espresso", children: "Your real business data will appear here." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-2xl text-[13.5px] leading-relaxed text-taupe", children: "No demo numbers are shown. Connect your marketplace, booking, and financial data to populate these metrics." }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 grid gap-3 sm:grid-cols-3", children:
          ["Vendor activity", "Bookings", "Financials"].map((label) =>
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-white/70 bg-white/70 p-4", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.14em] text-taupe", children: label }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm font-semibold text-espresso", children: "No live data yet" })
            ] }, label)
          )
        })
      ] })
    })
   });
}
function FinancialIllustration({ width = 340 }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 120, damping: 18 });
  const sy = useSpring(y, { stiffness: 120, damping: 18 });
  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width - 0.5;
    const ry = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(rx * 16);
    y.set(ry * 10);
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      onMouseMove: handleMove,
      onMouseLeave: () => {
        x.set(0);
        y.set(0);
      },
      className: "pointer-events-auto -mt-10 w-full max-w-[620px] lg:max-w-[680px]",
      children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -left-6 -top-6 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(255,244,225,0.45),transparent_60%)] blur-3xl opacity-70" }),
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            style: { x: sx, y: sy },
            className: "relative z-10 mx-auto flex items-center justify-center",
            children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(212,177,104,0.18),transparent_70%)] blur-3xl" }),
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: "https://raw.githubusercontent.com/Prer26/Event-Petals/main/src/assets/images/finance.png",
                  alt: "Financial Intelligence",
                  style: { width },
                  className: "\n      relative z-10\n      w-[520px]\n      max-w-none\n      object-contain\n      drop-shadow-[0_40px_80px_rgba(185,150,90,0.28)]\n      transition-all\n      duration-500\n      hover:scale-105\n      animate-float-soft\n    "
                }
              )
            ]
          }
        )
      ] })
    }
  );
}
function TrustedMarquee() {
  const brands = [
    "Raghava Pencil Art",
    "Shree Prakaram Caterer",
    "Annapoorneshwari Catering Service",
    "Triksha Photography",
    "Vastram Coucher",
    "Royale Camera",
    "Wedding Photographer Films by Mahesh Bangalore",
    "Event photographer's",
    "Wedding Photography by GK Vale",
    "Len Freelance Photography",
    "Hemanth Photography Bengaluru"
  ];
  const loop = [...brands, ...brands];
  return /* @__PURE__ */ jsxs("section", { className: "relative border-y border-border/70 bg-[#F3E7D3] py-12", children: [
    /* @__PURE__ */ jsx("p", { className: "text-center text-[11px] uppercase tracking-[0.24em] text-taupe", children: "Trusted by " }),
    /* @__PURE__ */ jsxs("div", { className: "relative mt-7 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#F3E7D3] to-transparent" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#F3E7D3] to-transparent" }),
      /* @__PURE__ */ jsx("div", { className: "flex w-max animate-[marquee_28s_linear_infinite] gap-4 hover:[animation-play-state:paused]", children: loop.map((b, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "group flex shrink-0 items-center gap-2.5 rounded-2xl border border-border/60 bg-white/70 px-6 py-3.5 shadow-soft backdrop-blur transition-all duration-300 hover:border-champagne/60 hover:shadow-luxe",
          children: [
            /* @__PURE__ */ jsx("span", { className: "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-beige text-[11px] font-bold text-taupe grayscale transition-all duration-300 group-hover:bg-champagne/25 group-hover:text-espresso group-hover:grayscale-0", children: b.split(" ").map((w) => w[0]).slice(0, 2).join("") }),
            /* @__PURE__ */ jsx("span", { className: "whitespace-nowrap font-display text-[14px] font-semibold tracking-tight text-taupe/70 grayscale transition-all duration-300 group-hover:text-espresso group-hover:grayscale-0", children: b })
          ]
        },
        `${b}-${i}`
      )) })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[marquee_28s_linear_infinite\\] { animation: none; }
        }
      ` })
  ] });
}
function MarketplacePreview() {
  const vendors = [
    { name: "Triksha Photography", category: "Photography", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80" },
    { name: "Shree Prakaram Caterer", category: "Catering", image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80" },
    { name: "Vastram Coucher", category: "Boutique", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80" }
  ];

  const [query, setQuery] = useState("");

  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(query.toLowerCase())
  );

  return /* @__PURE__ */ jsx(SectionShell, {
    eyebrow: "Marketplace",
    title: "Discover real Eventneve vendors.",
    description: "Meet a few real vendors currently being introduced through Eventneve. Explore the marketplace to discover more.",
    children: /* @__PURE__ */ jsxs(Reveal, { className: "glass-panel mt-10 rounded-[30px] p-3 shadow-luxe", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-[24px] border border-white/70 bg-white/75 p-4 shadow-soft backdrop-blur", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 md:flex-row md:items-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-1 items-center gap-3 rounded-2xl border border-champagne/30 bg-[linear-gradient(135deg,rgba(246,237,220,0.85),rgba(255,252,247,0.8))] px-4 py-3.5", children: [
            /* @__PURE__ */ jsx("span", { className: "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-espresso text-ivory", children: /* @__PURE__ */ jsx(Search, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsx("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: "Search vendors…", className: "w-full bg-transparent text-sm text-espresso placeholder:text-taupe focus:outline-none" }),
            /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 shrink-0 text-taupe" })
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => window.dispatchEvent(new CustomEvent("open-nova-chat")), className: "inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[linear-gradient(135deg,var(--champagne),var(--bronze))] px-5 py-3.5 text-[13px] font-semibold text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:shadow-luxe", children: [
            /* @__PURE__ */ jsx(Zap, { className: "h-3.5 w-3.5" }),
            "Ask Nova AI"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3", children:
        filteredVendors.map((vendor, i) => /* @__PURE__ */ jsxs(motion.article, {
          variants: fadeUp,
          custom: i,
          initial: "hidden",
          whileInView: "show",
          viewport: { once: true },
          whileHover: { y: -4 },
          className: "group rounded-[24px] border border-white/80 bg-white/80 p-3 shadow-soft transition-all duration-300 hover:shadow-float",
          children: [
            /* @__PURE__ */ jsx("div", { className: "relative h-44 overflow-hidden rounded-[18px] bg-beige", children: /* @__PURE__ */ jsx("img", { src: vendor.image, alt: vendor.name, className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", loading: "lazy" }) }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 flex items-start gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-beige text-espresso", children: /* @__PURE__ */ jsx(BadgeCheck, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsx("h4", { className: "font-display text-[16px] font-semibold leading-snug text-espresso", children: vendor.name })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-[11px] uppercase tracking-[0.14em] text-taupe", children: vendor.category }),
            /* @__PURE__ */ jsx(Link, { to: "/marketplace", className: "mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-espresso hover:text-bronze", children: ["View marketplace ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" })] })
          ]
        }, vendor.name))
      }),
      /* @__PURE__ */ jsx("div", { className: "mt-7 flex justify-center", children: /* @__PURE__ */ jsxs(Link, { to: "/marketplace", className: "group inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--champagne),var(--bronze))] px-6 py-3 text-[13px] font-semibold text-ivory shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-luxe", children: [
        "Explore Marketplace",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" })
      ] }) })
    ] })
  });
}
function PopularCategories() {
  const categories = ["Catering", "Photography", "Decor", "Venues", "Entertainment", "Art & Custom Services"];

  return /* @__PURE__ */ jsx(SectionShell, {
    eyebrow: "Explore",
    title: "Explore event service categories",
    description: "Browse the categories supported by the Eventneve marketplace.",
    tone: "soft",
    children: /* @__PURE__ */ jsx("div", { className: "mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3", children:
      categories.map((category, i) => /* @__PURE__ */ jsxs(motion.article, {
        variants: fadeUp,
        custom: i,
        initial: "hidden",
        whileInView: "show",
        viewport: { once: true },
        whileHover: { y: -6 },
        className: "rounded-[26px] border border-white/80 bg-white/80 p-6 shadow-soft",
        children: [
          /* @__PURE__ */ jsx("div", { className: "grid h-12 w-12 place-items-center rounded-2xl bg-beige text-espresso", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsx("h3", { className: "mt-5 font-display text-[20px] font-semibold text-espresso", children: category }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-[13px] leading-relaxed text-taupe", children: "Explore available Eventneve listings in this category." }),
          /* @__PURE__ */ jsx(Link, { to: "/marketplace", className: "mt-5 inline-flex items-center gap-1 text-[12px] font-semibold text-espresso", children: ["Explore ", /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" })] })
        ]
      }, category))
    })
  });
}
function FinancialTrackerPreview() {
  return /* @__PURE__ */ jsx(SectionShell, {
    eyebrow: "Financial Tracker",
    title: "Financial intelligence for event teams.",
    description: "No financial demo figures are displayed. This section is ready for your real Eventneve financial data.",
    tone: "champagne",
    children: /* @__PURE__ */ jsx("div", { className: "mt-8 mx-auto max-w-6xl", children:
      /* @__PURE__ */ jsxs(Reveal, { className: "relative overflow-visible rounded-[28px] border border-[rgba(209,186,159,0.28)] bg-[rgba(250,247,243,0.82)] p-6 shadow-float backdrop-blur", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.16em] text-taupe", children: "Financial Intelligence" }),
            /* @__PURE__ */ jsx("h3", { className: "mt-2 font-display text-2xl font-semibold text-espresso", children: "Your real financial data belongs here." }),
            /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-sm text-[13px] leading-relaxed text-taupe", children: "Revenue, budgets, expenses, vendor payments, and allocations will be displayed from the data stored in your Financial Tracker." }),
            /* @__PURE__ */ jsx(Link, { to: "/financial-tracker", className: "mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--champagne),var(--bronze))] px-4 py-2 text-[13px] font-semibold text-ivory shadow-gold", children: ["Open Financial Tracker", /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "rounded-[22px] border border-dashed border-border/70 bg-white/60 p-8 text-center", children: [
            /* @__PURE__ */ jsx(Wallet, { className: "mx-auto h-8 w-8 text-champagne" }),
            /* @__PURE__ */ jsx("p", { className: "mt-4 font-display text-lg font-semibold text-espresso", children: "No financial data loaded" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-taupe", children: "Connect your real transactions and budgets to populate this preview." })
          ] })
        ] })
      ] })
    })
  });
}
function Testimonials() {
  const reviews = [
    { company: "Triksha Photography", category: "Photography", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=200&q=80" },
    { company: "Shree Prakaram Caterer", category: "Catering", image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=200&q=80" },
    { company: "Vastram Coucher", category: "Boutique", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80" }
  ];
  const loop = [...reviews, ...reviews];

  return /* @__PURE__ */ jsx(SectionShell, {
    eyebrow: "Vendor Reviews",
    title: "What our vendor partners say.",
    description: "A dedicated space for verified feedback from Eventneve vendor partners.",
    children: /* @__PURE__ */ jsx("div", { className: "mt-8 overflow-hidden rounded-[30px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,252,247,0.96),rgba(248,241,227,0.92))] p-4 shadow-luxe", children: /* @__PURE__ */ jsx("div", { className: "flex w-max animate-[marquee_28s_linear_infinite] gap-4 hover:[animation-play-state:paused]", children: loop.map((item, index) => /* @__PURE__ */ jsxs("article", { className: "w-[320px] rounded-[24px] border border-white/80 bg-white/80 p-6 shadow-soft", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("img", { src: item.image, alt: item.company, className: "h-11 w-11 rounded-full object-cover" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-semibold text-espresso", children: item.company }),
          /* @__PURE__ */ jsx("p", { className: "text-[11px] text-taupe", children: item.category })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-5 rounded-2xl border border-dashed border-border/70 bg-cream/50 p-4 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-[12px] leading-relaxed text-taupe", children: "Verified vendor review will appear here." }) }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-[10px] uppercase tracking-[0.16em] text-taupe", children: "Real vendor partner" })
    ] }, `${item.company}-${index}`)) }) })
  });
}
function FAQ() {
  const qs = [
    {
      q: "How does the vendor marketplace work?",
      a: "Eventneve can display vendor listings from the marketplace data connected to your application."
    },
    {
      q: "Can I manage multiple events and teams?",
      a: "Eventneve is designed to bring event, vendor, client, and operational workflows into one workspace."
    },
    {
      q: "What does the Financial Tracker show?",
      a: "The Financial Tracker can display your actual transactions, budgets, expenses, allocations, and payment records."
    },
    {
      q: "Where does vendor information come from?",
      a: "Vendor information should come from your application's real marketplace data rather than hardcoded demo records."
    },
    {
      q: "Can the homepage use live data?",
      a: "Yes. Homepage sections can be connected to your existing API or database so the displayed information stays tied to real records."
    }
  ];
  const [open, setOpen] = useState(0);

  return /* @__PURE__ */ jsx(SectionShell, { eyebrow: "FAQ", title: "Answers to common Eventneve questions.", tone: "soft", children: /* @__PURE__ */ jsx("div", { className: "mx-auto mt-10 max-w-3xl space-y-3", children: qs.map((item, i) => {
    const isOpen = open === i;
    return /* @__PURE__ */ jsxs(Reveal, {
      i,
      className: `overflow-hidden rounded-[22px] border bg-white/70 shadow-soft backdrop-blur transition-all duration-300 ${isOpen ? "border-champagne/60 shadow-luxe" : "border-border/70"}`,
      children: [
        /* @__PURE__ */ jsxs("button", {
          onClick: () => setOpen(isOpen ? null : i),
          className: "flex w-full items-center justify-between gap-4 px-6 py-5 text-left",
          children: [
            /* @__PURE__ */ jsx("span", { className: "font-display text-[16px] font-semibold text-espresso", children: item.q }),
            /* @__PURE__ */ jsx("span", { className: `grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br transition-all duration-300 ${isOpen ? "from-champagne to-bronze text-ivory rotate-180" : "from-beige to-sand text-espresso"}`, children: isOpen ? /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }) })
          ]
        }),
        /* @__PURE__ */ jsx("div", { className: `grid overflow-hidden px-6 text-[14px] leading-relaxed text-taupe transition-all duration-500 ease-out ${isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"}`, children: /* @__PURE__ */ jsx("div", { className: "min-h-0", children: item.a }) })
      ]
    }, i);
  }) }) });
}
function CTA() {
  const { isAuthenticated, user } = useAuth();
  const isVendor = user?.account_type === "vendor";
  return /* @__PURE__ */ jsx("section", { className: "px-6 pb-28 pt-14", children: /* @__PURE__ */ jsxs(Reveal, { className: "relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,252,247,0.96),rgba(248,241,227,0.94))] shadow-float", children: [
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(200,169,106,0.25),transparent_70%)] blur-3xl" }),
    /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(185,145,79,0.16),transparent_70%)] blur-3xl" }),
    /* @__PURE__ */ jsxs("div", { className: "relative grid gap-10 p-10 sm:p-14 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:p-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-xl", children: [
        /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-taupe backdrop-blur", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3 text-champagne" }),
          "The premium OS for event teams"
        ] }),
        /* @__PURE__ */ jsxs("h2", { className: "mt-5 font-display text-4xl font-bold leading-tight tracking-tight text-espresso sm:text-5xl", children: [
          "Run every event like your ",
          /* @__PURE__ */ jsx("span", { className: "text-gold-gradient", children: "signature" }),
          " brand."
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-xl text-[15.5px] leading-relaxed text-taupe", children: "Join the event companies turning vendor discovery, operations, and finance into one elegant, AI-native experience." }),
        /* @__PURE__ */ jsx("ul", { className: "mt-7 grid gap-2.5 sm:grid-cols-2", children: ["3,240+ verified vendors", "Real-time finance ledger", "Bank-grade security", "Dedicated onboarding"].map((f) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-[13px] text-taupe", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 shrink-0 text-success" }),
          " ",
          f
        ] }, f)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: !isAuthenticated ? "/register" : isVendor ? "/vendor-dashboard" : "/dashboard",
              className: "group inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--champagne),var(--bronze))] px-6 py-3.5 text-[14px] font-semibold text-ivory shadow-gold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float",
              children: [
                isAuthenticated ? "Go to Dashboard " : "Get Started ",
                /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" })
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Link,
            {
              to: "/contact",
              className: "inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-6 py-3.5 text-[14px] font-semibold text-espresso backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-soft",
              children: "Book a private demo"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative hidden h-72 lg:block", children: [
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.6 },
            className: "absolute left-0 top-0 w-56 rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-luxe backdrop-blur",
            children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.14em] text-taupe", children: "Revenue this month" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 font-display text-xl font-bold text-espresso", children: "\u20B9 92.4L" }),
              /* @__PURE__ */ jsx("div", { className: "mt-3 flex h-10 items-end gap-1", children: [30, 50, 40, 70, 60, 85].map((h, i) => /* @__PURE__ */ jsx("div", { className: "w-full rounded-t bg-champagne/70", style: { height: `${h}%` } }, i)) })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.6, delay: 0.15 },
            className: "absolute right-2 top-16 w-48 rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-luxe backdrop-blur",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(BadgeCheck, { className: "h-4 w-4 text-success" }),
                /* @__PURE__ */ jsx("p", { className: "text-[12px] font-semibold text-espresso", children: "Vendor verified" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-[11px] text-taupe", children: "Aperture Studios \xB7 Mumbai" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          motion.div,
          {
            initial: { opacity: 0, y: 20 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true },
            transition: { duration: 0.6, delay: 0.3 },
            className: "absolute bottom-0 left-10 w-52 rounded-[22px] border border-white/80 bg-white/80 p-4 shadow-luxe backdrop-blur",
            children: [
              /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.14em] text-taupe", children: "Payment cleared" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 font-display text-lg font-bold text-success", children: "+\u20B9 8,40,000" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] text-taupe", children: "Rao Wedding \xB7 Milestone 2" })
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
function SectionShell({
  eyebrow,
  title,
  description,
  children,
  tone = "plain",
  className = ""
}) {
  const bg = "bg-[#F3E7D3]";
  return /* @__PURE__ */ jsx("section", { className: `relative px-6 py-20 sm:py-24 ${bg} ${className}`.trim(), children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl", children: [
    /* @__PURE__ */ jsxs(Reveal, { className: "max-w-2xl", children: [
      /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.2em] text-bronze", children: eyebrow }),
      /* @__PURE__ */ jsx("h2", { className: "mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight text-espresso sm:text-4xl lg:text-[42px]", children: title }),
      description && /* @__PURE__ */ jsx("p", { className: "mt-4 text-[15.5px] leading-relaxed text-taupe", children: description })
    ] }),
    children
  ] }) });
}