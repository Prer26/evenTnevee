import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Gem,
  HeartHandshake,
  Lightbulb,
  MapPin,
  MessageSquareText,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const STORY_STEPS = [
  {
    label: "The idea",
    title: "Built around a real event-management problem",
    body:
      "evenTneve is being built to bring the important parts of event management into one connected platform instead of making teams move between scattered tools and conversations.",
    icon: Lightbulb,
  },
  {
    label: "The problem",
    title: "Too many disconnected workflows",
    body:
      "Vendor discovery, communication, planning, and financial work can easily become difficult to keep organized when they are handled across different places.",
    icon: MapPin,
  },
  {
    label: "The vision",
    title: "One intelligent event workspace",
    body:
      "Our goal is to connect vendor discovery, event operations, financial workflows, analytics, and AI assistance in one simple experience.",
    icon: Target,
  },
  {
    label: "Today",
    title: "An evolving Event OS",
    body:
      "evenTneve brings together a vendor marketplace, financial workflows, analytics, event operations, and Eva AI as the platform continues to grow.",
    icon: Rocket,
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified Marketplace",
    body:
      "Discover and connect with verified vendors through the Eventneve marketplace.",
  },
  {
    icon: Wallet,
    title: "Financial Tracker",
    body:
      "Keep event budgets, payments, expenses, and financial information organized in one place.",
  },
  {
    icon: Bot,
    title: "Eva AI",
    body:
      "An intelligent event assistant that helps with vendor discovery, planning, and event-management questions.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body:
      "Bring relevant event and business information together so teams can understand their activity more clearly.",
  },
];

const VALUES = [
  {
    icon: Sparkles,
    title: "Innovation",
    body: "Use technology and AI to make event workflows simpler.",
  },
  {
    icon: ShieldCheck,
    title: "Trust",
    body: "Build dependable vendor and business workflows.",
  },
  {
    icon: Gem,
    title: "Elegance",
    body: "Make every interaction feel thoughtful and premium.",
  },
  {
    icon: HeartHandshake,
    title: "Customer Success",
    body: "Build around the needs of event-management teams.",
  },
  {
    icon: Users,
    title: "Simplicity",
    body: "Turn complex workflows into clear, manageable experiences.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F3E7D3] text-[#292525]">
      <Hero />
      <OurStory />
      <MissionVision />
      <CoreValues />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative px-6 pb-20 pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7A2348]">
            About evenTneve
          </p>

          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight text-[#292525] sm:text-5xl">
            Building a simpler way to{" "}
            <span className="text-[#7A2348]">run events.</span>
          </h1>

          <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-[#6F6265]">
            evenTneve is an event-management platform designed to bring vendor
            discovery, financial workflows, planning, analytics, and AI
            assistance into one connected experience.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/marketplace"
              className="rounded-full bg-[#7A2348] px-6 py-3 text-[13.5px] font-semibold text-white shadow-[0_10px_25px_rgba(122,35,72,0.18)] transition hover:bg-[#641B3B]"
            >
              Explore Marketplace
            </Link>

            <Link
              to="/contact"
              className="rounded-full border border-[#C9A77D] bg-[#F3E7D3] px-6 py-3 text-[13.5px] font-semibold text-[#292525] transition hover:border-[#7A2348] hover:text-[#7A2348]"
            >
              Get in touch
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative border-l-2 border-[#7A2348] pl-8 sm:pl-12"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7A2348]">
            Eventneve ecosystem
          </p>
          <div className="mt-8 space-y-0">
            {[
              { icon: MapPin, label: "Vendor Discovery" },
              { icon: MessageSquareText, label: "Vendor Communication" },
              { icon: Wallet, label: "Financial Tracker" },
              { icon: Bot, label: "Eva AI" },
            ].map(({ icon: Icon, label }, index) => (
              <div
                key={label}
                className="flex items-center gap-4 border-b border-[#D8B992] py-5 last:border-b-0"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#C9A77D] bg-[#F3E7D3] text-[#7A2348]">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8A777A]">
                    0{index + 1}
                  </span>
                  <p className="font-display text-[15px] font-semibold text-[#292525]">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function OurStory() {
  return (
    <section className="border-t border-[#D8B992] px-6 pt-16 pb-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7A2348]">
              Our Story
            </p>

            <h2 className="mt-3 max-w-md font-display text-3xl font-bold leading-tight tracking-tight text-[#292525] sm:text-4xl">
              From a simple problem to a connected event platform.
            </h2>
          </div>

          <p className="max-w-2xl text-[15px] leading-7 text-[#6F6265]">
            evenTneve is being built around a simple idea: event-management
            teams should not have to keep jumping between disconnected tools
            just to get one event across the finish line.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-[28px] border border-[#C9A77D] bg-[#C9A77D] md:grid-cols-3">
          {[
            {
              number: "01",
              title: "The problem",
              body:
                "Vendor discovery, communication, planning, and financial work can become scattered across different tools and conversations.",
            },
            {
              number: "02",
              title: "The idea",
              body:
                "Bring those important workflows together in one clear platform designed specifically around event businesses.",
            },
            {
              number: "03",
              title: "The direction",
              body:
                "Combine marketplace tools, financial workflows, analytics, and Eva AI into one evolving Eventneve experience.",
            },
          ].map((step) => (
            <motion.div
              key={step.number}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="bg-[#F3E7D3] p-7 sm:p-8"
            >
              <span className="text-[11px] font-semibold tracking-[0.18em] text-[#7A2348]">
                {step.number}
              </span>

              <h3 className="mt-10 font-display text-xl font-semibold text-[#292525]">
                {step.title}
              </h3>

              <p className="mt-3 text-[13.5px] leading-6 text-[#6F6265]">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
          transition={{ duration: 0.45 }}
          className="mt-6 flex flex-col gap-4 rounded-[24px] border border-[#C9A77D] bg-[#F3E7D3] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7"
        >
          <p className="max-w-2xl text-[13.5px] leading-6 text-[#6F6265]">
            The goal is not to add more complexity. It is to make the entire
            journey from finding a vendor to delivering an event feel more
            connected.
          </p>

          <span className="shrink-0 font-display text-sm font-semibold text-[#7A2348]">
            Built for event businesses.
          </span>
        </motion.div>
      </div>
    </section>
  );
}

function MissionVision() {
  const items = [
    {
      number: "01",
      icon: Target,
      title: "Mission",
      body:
        "Make event management simpler by connecting the workflows teams use every day — from vendor discovery and communication to finance and execution.",
      label: "What we are building around",
    },
    {
      number: "02",
      icon: Rocket,
      title: "Vision",
      body:
        "Build a trusted AI-powered operating system for the event industry that helps teams plan clearly, work efficiently, and grow with confidence.",
      label: "Where we want to take it",
    },
  ];

  return (
    <section className="px-6 pt-10 pb-20 sm:pt-14 sm:pb-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mb-16 max-w-2xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7A2348]">
            What drives us
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#292525] sm:text-5xl">
            Built with purpose. Moving with direction.
          </h2>
        </motion.div>

        <div className="relative grid md:grid-cols-2">
          <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-[#C9A77D] md:block" />

          {items.map(({ number, icon: Icon, title, body, label }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className={`relative py-2 md:px-12 ${index === 0 ? "md:pr-16" : "md:pl-16"}`}
            >
              <div className="flex items-start justify-between gap-8">
                <span className="font-display text-7xl font-semibold leading-none text-[#E2C9A7] sm:text-8xl">
                  {number}
                </span>
                <span className="mt-2 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#C9A77D] text-[#7A2348]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>

              <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A777A]">
                {label}
              </p>

              <h3 className="mt-3 font-display text-3xl font-semibold text-[#292525] sm:text-4xl">
                {title}
              </h3>

              <p className="mt-5 max-w-xl text-[14px] leading-7 text-[#6F6265] sm:text-[15px]">
                {body}
              </p>

              <div className="mt-10 h-px w-20 bg-[#7A2348]" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoreValues() {
  return (
    <section className="border-t border-[#D8B992] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A2348]">
            Core Values
          </p>

          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#292525] sm:text-4xl">
            What we hold ourselves to
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {VALUES.map(({ icon: Icon, title, body }, index) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -3 }}
              className="rounded-[22px] border border-[#D8B992] bg-[#F3E7D3] p-5 text-center transition-colors hover:border-[#7A2348]"
            >
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#F3E7D3] text-[#7A2348]">
                <Icon className="h-4 w-4" />
              </span>

              <p className="mt-3 font-display text-sm font-semibold text-[#292525]">
                {title}
              </p>

              <p className="mt-1.5 text-[12px] leading-relaxed text-[#6F6265]">
                {body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}