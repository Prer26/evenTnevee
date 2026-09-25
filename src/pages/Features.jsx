import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Search,
  MessageSquareText,
  LineChart,
  CalendarClock,
  Lock,
  Headset,
  Bot,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Marketplace",
    description:
      "Discover event professionals through the Eventneve marketplace.",
    details:
      "Explore vendor profiles, categories, locations, and services available through the marketplace.",
  },
  {
    icon: Search,
    title: "Smart AI Search",
    description:
      "Eva helps you find relevant vendors using your event requirements, location, and preferences.",
    details:
      "Eva can use your event requirements to guide vendor discovery and help you narrow down relevant options.",
  },
  {
    icon: MessageSquareText,
    title: "Vendor Communication",
    description:
      "Keep vendor conversations, quotations, approvals, and follow-ups organized.",
    details:
      "Keep vendor conversations, quote requests, approvals, and follow-ups connected to the vendors you work with.",
  },
  {
    icon: LineChart,
    title: "Analytics Dashboard",
    description:
      "Understand your event activity and business performance in one place.",
    details:
      "Review available event, booking, vendor, and business insights from one organized dashboard.",
  },
  {
    icon: CalendarClock,
    title: "Event Workspace",
    description:
      "Manage timelines, tasks, teams, and event execution together.",
    details:
      "Organize event timelines, assign tasks, set milestones, and keep your event workflow connected.",
  },
  {
    icon: Lock,
    title: "Secure Platform",
    description:
      "Manage your event business through secure application access.",
    details:
      "Use secure access controls and protected application infrastructure while managing your event information.",
  },
  {
    icon: Headset,
    title: "Premium Support",
    description:
      "Get help while using Eventneve and managing your workflow.",
    details:
      "Get support with using the platform, navigating your workspace, and getting started with Eventneve.",
  },
  {
    icon: Bot,
    title: "Eva AI Assistant",
    description:
      "Your intelligent event management assistant, always ready to help.",
    details:
      "Ask Eva about vendors, event planning, budgets, timelines, and day-to-day event management tasks.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F3E7D3] text-[#292525]">
      <Hero />
      <FeatureGrid />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative px-6 pb-16 pt-24 text-center">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7A2348]">
          Features
        </p>

        <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-[#292525] sm:text-5xl md:text-6xl">
          Everything you need to run{" "}
          <span className="text-[#7A2348]">premium events.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-[#6F6265]">
          One intelligent platform for vendor discovery, analytics, planning,
          communication, and event operations.
        </p>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (expanded === null) return;

    const timer = setTimeout(() => {
      setExpanded(null);
    }, 7000);

    return () => clearTimeout(timer);
  }, [expanded]);

  const handleToggle = (index) => {
    setExpanded((current) => (current === index ? null : index));
  };

  return (
    <section className="px-6 pb-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const isOpen = expanded === index;

          return (
            <article
              key={feature.title}
              className={`flex flex-col rounded-[28px] border p-7 transition-all duration-300 ${
                isOpen
                  ? "border-[#7A2348] bg-[#F3E7D3] shadow-[0_18px_45px_rgba(122,35,72,0.14)]"
                  : "border-[#D8B992] bg-[#F3E7D3] hover:-translate-y-1 hover:border-[#7A2348] hover:shadow-[0_18px_40px_rgba(122,35,72,0.10)]"
              }`}
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EBD9BC] text-[#7A2348]">
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mt-6 font-display text-lg font-semibold text-[#292525]">
                {feature.title}
              </h3>

              <p className="mt-2 text-[13.5px] leading-relaxed text-[#6F6265]">
                {feature.description}
              </p>

              <button
                type="button"
                onClick={() => handleToggle(index)}
                className="mt-5 flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[#7A2348]"
              >
                <span>{isOpen ? "Close details" : "Learn more"}</span>
                <ArrowRight
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${
                    isOpen ? "rotate-90" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-5 rounded-2xl border-[1.5px] border-[#7A2348] bg-[#F3E7D3] p-4">
                  <p className="text-[13px] leading-6 text-[#292525]">
                    {feature.details}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
