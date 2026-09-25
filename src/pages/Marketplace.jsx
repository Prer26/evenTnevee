import { jsx, jsxs } from "react/jsx-runtime";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  CalendarDays,
  Clock3,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Video,
  Wallet,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import BookingModal from "@/components/BookingModal";
const CATEGORIES = ["All", "Photography", "Art & Custom Services", "Boutique", "Catering"];
const CITIES = ["All Cities", "Chennai", "Bangalore"];
const RATING_OPTIONS = [0];
const VENDORS = [
  {
    name: "Raghava Pencil Art",
    category: "Art & Custom Services",
    city: "Bangalore",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Custom pencil art and personalised artwork for memorable events and celebrations.",
    services: ["Custom Pencil Art", "Portrait Art", "Event Gifts"],
    gallery: [
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#F3ECE3] via-[#F8F1E7] to-[#FCFBF8]"
  },
  {
    name: "Shree Prakaram Caterer",
    category: "Catering",
    city: "Bangalore",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Catering services for weddings, celebrations, corporate events and special occasions.",
    services: ["Wedding Catering", "Traditional Catering", "Event Catering"],
    gallery: [
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#F5EBD8] via-[#FAF0E1] to-[#FFFDF8]"
  },
  {
    name: "Annapoorneshwari Catering Service",
    category: "Catering",
    city: "Chennai",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Catering services for weddings, family functions, celebrations and special events.",
    services: ["Wedding Catering", "Traditional Menus", "Event Catering"],
    gallery: [
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#F3E7D3] via-[#F8F1E7] to-[#FCFBF8]"
  },
  {
    name: "Triksha Photography",
    category: "Photography",
    city: "Bangalore",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Photography services for weddings, events, portraits and special celebrations.",
    services: ["Wedding Photography", "Event Photography", "Portraits"],
    gallery: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#EEE5DA] via-[#F7EEE2] to-[#FDF8F1]"
  },
  {
    name: "Vastram Coucher",
    category: "Boutique",
    city: "Bangalore",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Boutique fashion and curated designs for celebrations, traditional occasions and special events.",
    services: ["Sarees", "Custom Designs", "Boutique Wear"],
    gallery: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#F3E7D3] via-[#F8F1E7] to-[#FCFBF8]"
  },
  {
    name: "Royale Camera",
    category: "Photography",
    city: "Chennai",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Photography and visual coverage for weddings, events and memorable celebrations.",
    services: ["Wedding Photography", "Event Coverage", "Candid Photography"],
    gallery: [
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#EFE6D9] via-[#F8F0E6] to-[#FFFDFC]"
  },
  {
    name: "Wedding Photographer Films by Mahesh Bangalore",
    category: "Photography",
    city: "Bangalore",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Wedding photography and films capturing celebrations, ceremonies and candid moments.",
    services: ["Wedding Photography", "Wedding Films", "Candid Coverage"],
    gallery: [
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#F1E7DB] via-[#F9F2E8] to-[#FFFDF9]"
  },
  {
    name: "Event photographer's",
    category: "Photography",
    city: "Chennai",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Event photography services for celebrations, functions and memorable occasions.",
    services: ["Event Photography", "Candid Photography", "Portraits"],
    gallery: [
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#EEE5DA] via-[#F7EEE2] to-[#FDF8F1]"
  },
  {
    name: "Wedding Photography by GK Vale",
    category: "Photography",
    city: "Bangalore",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Wedding photography services focused on capturing authentic moments and celebrations.",
    services: ["Wedding Photography", "Candid Photography", "Couple Portraits"],
    gallery: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#F0E5D8] via-[#F8EFE3] to-[#FFFDF9]"
  },
  {
    name: "Len Freelance Photography",
    category: "Photography",
    city: "Chennai",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Freelance photography for events, celebrations, portraits and wedding moments.",
    services: ["Event Photography", "Wedding Photography", "Portraits"],
    gallery: [
      "https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1504150558240-0b4fd8946624?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#EDE3D7] via-[#F8EEE1] to-[#FFFDF8]"
  },
  {
    name: "Hemanth Photography Bengaluru",
    category: "Photography",
    city: "Bangalore",
    price: "Contact for quote",
    priceValue: 20000000,
    description: "Photography services for weddings, events and celebrations across Bengaluru.",
    services: ["Wedding Photography", "Event Photography", "Candid Coverage"],
    gallery: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1000&q=80"
    ],
    responseTime: "Contact vendor",
    availability: "Contact for availability",
    verified: false,
    match: null,
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",
    accent: "from-[#EFE6D9] via-[#F8F0E6] to-[#FFFDFC]"
  }
];

const TOP_STATS = [
  { value: "11", label: "Real Vendors" },
  { value: "2", label: "Cities" },
  { value: "5", label: "Categories" },
  { value: "Direct", label: "Vendor Contact" },
  { value: "Local", label: "Marketplace" }
];
const TRUST_POINTS = [
  { icon: BadgeCheck, label: "Real Vendor Listings" },
  { icon: ShieldCheck, label: "Chennai + Bangalore" },
  { icon: Lock, label: "Direct Vendor Contact" },
  { icon: Wallet, label: "Clear Service Details" },
  { icon: Sparkles, label: "Event-focused Marketplace" }
];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedRating, setSelectedRating] = useState(0);
  const [budgetCap, setBudgetCap] = useState(2e7);
  const [favorites, setFavorites] = useState([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [contactVendor, setContactVendor] = useState(null);
  const [aiMatchOpen, setAiMatchOpen] = useState(false);
  const [vendorList, setVendorList] = useState(VENDORS);
  const [aiLoading, setAiLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bookingVendor, setBookingVendor] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setVisibleCount(9);
  }, [selectedCategory, query, selectedCity, selectedRating, budgetCap]);
  const filteredVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const vendors = vendorList.filter((vendor) => {
      const matchesCategory = selectedCategory === "All" || vendor.category === selectedCategory;
      const matchesCity = selectedCity === "All Cities" || vendor.city === selectedCity;
      const matchesRating = selectedRating === 0 || (vendor.rating != null && vendor.rating >= selectedRating);
      const matchesBudget = vendor.priceValue <= budgetCap;
      const haystack = [vendor.name, vendor.category, vendor.city, vendor.description, ...vendor.services].join(" ").toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || haystack.includes(normalizedQuery);
      return matchesCategory && matchesCity && matchesRating && matchesBudget && matchesQuery;
    });
    if (selectedCategory === "Catering") {
      const featured = vendors.find((vendor) => vendor.featured);
      if (featured) {
        const rest = vendors.filter((vendor) => vendor.name !== featured.name);
        return [featured, ...rest];
      }
    }
    return vendors;
  }, [budgetCap, query, selectedCategory, selectedCity, selectedRating, vendorList]);
  const visibleVendors = filteredVendors.slice(0, visibleCount);
  const hasMore = filteredVendors.length > visibleCount;
  const toggleFavorite = (vendorName) => {
    setFavorites((current) => current.includes(vendorName) ? current.filter((name) => name !== vendorName) : [...current, vendorName]);
  };
  const resetFilters = () => {
    setSelectedCategory("All");
    setQuery("");
    setSelectedCity("All Cities");
    setSelectedRating(0);
    setBudgetCap(2e7);
  };
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex flex-col justify-between gap-6 lg:flex-row lg:items-end", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7A2348]", children: "Marketplace" }),
        /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-4xl font-bold tracking-tight text-[#292525] sm:text-5xl", children: "Discover premium verified vendors for unforgettable events." }),
        /* @__PURE__ */ jsx("p", { className: "mt-3 text-[15px] leading-relaxed text-taupe", children: "Browse our real vendor partners in Chennai and Bangalore. Compare, save, and request quotes in minutes." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("button", { className: "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-[13px] font-semibold text-[#292525] shadow-soft transition-colors hover:bg-beige/60", children: [
          /* @__PURE__ */ jsx(Bookmark, { className: "h-4 w-4" }),
          " Saved Vendors ",
          favorites.length > 0 ? `(${favorites.length})` : ""
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setAiMatchOpen(true),
            className: "inline-flex items-center gap-2 rounded-full border border-[#E8C7CF]/70 bg-[#F3E7D3] px-4 py-2.5 text-[13px] font-semibold text-[#7A2348] shadow-soft transition-colors hover:bg-[#E8C7CF]/60",
            children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
              " AI Vendor Match"
            ]
          }
        ),

      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mt-6 rounded-[24px] border border-[#E8C7CF]/70 bg-gradient-to-r from-[#F3E7D3]/70 via-white to-[#F8EEF2]/70 p-5 shadow-soft", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-[#7A2348]", children: [
            /* @__PURE__ */ jsx(BadgeCheck, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold uppercase tracking-[0.16em]", children: "Built for real event businesses" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-[13px] leading-5 text-taupe", children: "Discover vendors across Chennai and Bangalore, compare services, and connect directly." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 text-[11px] font-semibold text-[#292525]", children: [
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-white px-3 py-1.5 shadow-sm", children: "Chennai" }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-white px-3 py-1.5 shadow-sm", children: "Bangalore" }),
          /* @__PURE__ */ jsx("span", { className: "rounded-full bg-white px-3 py-1.5 shadow-sm", children: "Direct vendor contact" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5", children: TOP_STATS.map((stat) => /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-sand/70 bg-card/70 p-4 text-center shadow-soft backdrop-blur-xl", children: [
      /* @__PURE__ */ jsx("p", { className: "font-display text-xl font-bold text-[#292525] sm:text-2xl", children: stat.value }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-[11px] uppercase tracking-wide text-taupe", children: stat.label })
    ] }, stat.label)) }),
    /* @__PURE__ */ jsxs("div", { className: "glass-panel mt-6 rounded-[24px] p-3 shadow-soft", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 md:flex-row md:items-center", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex flex-1 items-center gap-3 rounded-2xl bg-beige/60 px-4 py-3", children: [
          /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-taupe" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              value: query,
              onChange: (event) => setQuery(event.target.value),
              placeholder: "Search vendors, categories, or cities\u2026",
              className: "w-full bg-transparent text-sm text-[#292525] placeholder:text-taupe focus:outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setShowFilters(!showFilters), className: `inline-flex items-center justify-center gap-1.5 rounded-2xl border px-4 py-3 text-[13px] font-medium transition-colors ${showFilters ? "border-[#E8C7CF] bg-[#E8C7CF]/20 text-[#292525]" : "border-border bg-card text-[#292525] hover:bg-beige/60"}`, children: [
          /* @__PURE__ */ jsx(SlidersHorizontal, { className: "h-4 w-4" }),
          " Filters"
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: resetFilters, className: "rounded-2xl border border-border bg-card px-4 py-3 text-[13px] font-semibold text-[#292525] transition-colors hover:bg-beige/60", children: "Reset" })
      ] }),
      /* @__PURE__ */ jsx(motion.div, { layout: true, className: "mt-3 flex flex-wrap gap-2", children: CATEGORIES.map((category) => {
        const isActive = category === selectedCategory;
        return /* @__PURE__ */ jsx(
          motion.button,
          {
            whileTap: { scale: 0.96 },
            type: "button",
            onClick: () => setSelectedCategory(category),
            className: `rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all duration-300 ${isActive ? "border-transparent bg-gradient-to-r from-[#7A2348] via-[#7A2348] to-[#7A2348] text-white shadow-[0_12px_35px_rgba(122,35,72,0.25)]" : "border-border bg-card/80 text-[#292525] hover:bg-beige/70 hover:shadow-soft"}`,
            children: category
          },
          category
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid gap-6 lg:grid-cols-[240px_1fr]", children: [
      /* @__PURE__ */ jsx("aside", { className: `${showFilters ? "block" : "hidden"} order-2 lg:order-1 lg:block`, children: /* @__PURE__ */ jsxs("div", { className: "sticky top-24 rounded-[20px] border border-border bg-card p-5 shadow-soft", children: [
        /* @__PURE__ */ jsx(FilterGroup, { title: "City", children: CITIES.map((city) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 py-1 text-[13px] text-[#292525]", children: [
          /* @__PURE__ */ jsx("input", { type: "radio", name: "city", checked: selectedCity === city, onChange: () => setSelectedCity(city), className: "accent-[#7A2348]" }),
          city
        ] }, city)) }),
        /* @__PURE__ */ jsxs(FilterGroup, { title: "Budget", children: [
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between text-[12px] text-taupe", children: [
            /* @__PURE__ */ jsx("span", { children: "\u20B9 0" }),
            /* @__PURE__ */ jsx("span", { children: "\u20B9 20L+" })
          ] }),
          /* @__PURE__ */ jsx("input", { type: "range", min: "0", max: "20000000", step: "100000", value: budgetCap, onChange: (event) => setBudgetCap(Number(event.target.value)), className: "mt-2 w-full accent-[#7A2348]" }),
          /* @__PURE__ */ jsxs("p", { className: "mt-2 text-[12px] font-medium text-[#292525]", children: [
            "Up to ",
            budgetCap >= 2e7 ? "\u20B9 20L+" : `\u20B9 ${Math.round(budgetCap / 1e5)}L`
          ] })
        ] }),
        /* @__PURE__ */ jsx(FilterGroup, { title: "Rating", children: RATING_OPTIONS.map((rating) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 py-1 text-[13px] text-[#292525]", children: [
          /* @__PURE__ */ jsx("input", { type: "radio", name: "rating", checked: selectedRating === rating, onChange: () => setSelectedRating(rating), className: "accent-[#7A2348]" }),
          /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5 fill-[#7A2348] text-[#7A2348]" }),
            " ",
            rating === 0 ? "Any" : `${rating}+`
          ] })
        ] }, rating)) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "order-1 lg:order-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-4 flex flex-col gap-2 text-[13px] text-taupe sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-[#292525]", children: filteredVendors.length }),
            " vendors match your filters"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Sort: ",
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-[#292525]", children: "Most relevant" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(AnimatePresence, { mode: "popLayout", children: visibleVendors.length > 0 ? /* @__PURE__ */ jsx(motion.div, { layout: true, className: "grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3", children: visibleVendors.map((vendor) => {
          const isFavorite = favorites.includes(vendor.name);
          const isFeatured = vendor.featured && selectedCategory === "Catering";
          return /* @__PURE__ */ jsxs(
            motion.article,
            {
              layout: true,
              initial: { opacity: 0, y: 16, scale: 0.98 },
              animate: { opacity: 1, y: 0, scale: 1 },
              exit: { opacity: 0, y: -10, scale: 0.98 },
              transition: { duration: 0.24, ease: "easeOut" },
              whileHover: { y: -4, scale: 1.01 },
              className: `group relative flex h-full flex-col overflow-hidden rounded-[22px] border bg-card shadow-soft ${isFeatured ? "border-[#7A2348] shadow-[0_16px_40px_rgba(122,35,72,0.16)] sm:col-span-2 xl:col-span-2" : "border-border"}`,
              children: [
                isFeatured ? /* @__PURE__ */ jsx("div", { className: "absolute -right-11 top-6 z-10 w-40 rotate-45 bg-gradient-to-r from-[#7A2348] to-[#E8C7CF] py-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-soft", children: "Editor's Choice" }) : null,
                /* @__PURE__ */ jsxs("div", { className: `relative overflow-hidden bg-gradient-to-br ${vendor.accent} ${isFeatured ? "aspect-[16/9]" : "aspect-[4/3]"}`, children: [
                  /* @__PURE__ */ jsx("img", { src: vendor.image, alt: vendor.name, className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" }),
                  /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-[#18110d]/55 via-transparent to-transparent" }),
                  /* @__PURE__ */ jsxs("div", { className: "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground border border-border/40 shadow-soft backdrop-blur", children: [
                    /* @__PURE__ */ jsx(BadgeCheck, { className: "h-3 w-3 text-success" }),
                    " ",
                    isFeatured ? "Featured listing" : "Listed vendor"
                  ] }),
                  /* @__PURE__ */ jsx(
                    motion.button,
                    {
                      whileTap: { scale: 0.9 },
                      type: "button",
                      onClick: () => toggleFavorite(vendor.name),
                      className: `absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow-soft backdrop-blur border border-border/40 transition-all ${isFavorite ? "bg-[#E8C7CF] text-[#7A2348]" : "bg-card/90 text-foreground hover:text-error"}`,
                      "aria-pressed": isFavorite,
                      children: /* @__PURE__ */ jsx(Heart, { className: `h-4 w-4 ${isFavorite ? "fill-current" : ""}` })
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "absolute bottom-3 left-3 rounded-full bg-[#7A2348] px-2.5 py-1 text-[11px] font-semibold text-white", children: vendor.price }),
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col p-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsx("h3", { className: "truncate font-display text-[15px] font-semibold text-[#292525]", children: vendor.name }),
                      /* @__PURE__ */ jsx("p", { className: "mt-0.5 text-[12px] text-taupe", children: vendor.categoryLabel ?? vendor.category })
                    ] }),
                    vendor.match != null ? /* @__PURE__ */ jsxs("div", { className: "shrink-0 rounded-full border border-border bg-beige/70 px-2 py-1 text-[11px] font-semibold text-[#292525]", children: [
                      vendor.match ? `AI Match ${vendor.match}%` : "Direct listing"
                    ] }) : null
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "mt-3 min-h-[60px] text-[12px] leading-5 text-taupe", children: vendor.description }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-4 grid min-h-[64px] gap-2 text-[12px] text-taupe sm:grid-cols-2", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-2xl bg-beige/50 px-2.5 py-2", children: [
                      /* @__PURE__ */ jsx(Clock3, { className: "h-3.5 w-3.5 text-[#7A2348]" }),
                      " ",
                      vendor.responseTime
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-2xl bg-beige/50 px-2.5 py-2", children: [
                      /* @__PURE__ */ jsx(CalendarDays, { className: "h-3.5 w-3.5 text-[#7A2348]" }),
                      " ",
                      vendor.availability
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between text-[12px] text-taupe", children: [
                    /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx(MapPin, { className: "h-3.5 w-3.5" }),
                      " ",
                      vendor.city
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-[11px]", children: "Contact vendor for details" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-auto flex gap-2 pt-4", children: [
                    /* @__PURE__ */ jsx("button", { type: "button", onClick: () => navigate("/login"), className: "flex-1 rounded-full bg-[#7A2348] px-3 py-2 text-center text-[12.5px] font-semibold text-white transition-colors hover:opacity-90", children: "View profile" }),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => navigate("/login"),
                        className: "rounded-full border border-border bg-card px-3 py-2 text-[12.5px] font-semibold text-[#292525] transition-colors hover:bg-beige/60",
                        children: [
                          "Contact ",
                          /* @__PURE__ */ jsx(ArrowRight, { className: "ml-1 inline h-3.5 w-3.5" })
                        ]
                      }
                    )
                  ] })
                ] })
              ]
            },
            vendor.name
          );
        }) }) : /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, className: "rounded-[24px] border border-dashed border-border bg-card/70 p-12 text-center shadow-soft", children: [
          /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-beige/70 text-[#292525]", children: /* @__PURE__ */ jsx(Search, { className: "h-7 w-7" }) }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-2xl font-semibold text-[#292525]", children: "No vendors found" }),
          /* @__PURE__ */ jsx("p", { className: "mx-auto mt-2 max-w-md text-sm leading-6 text-taupe", children: "Try widening the search, switching categories, or clearing a filter to uncover more premium matches." })
        ] }) }),
        hasMore ? /* @__PURE__ */ jsx("div", { className: "mt-6 flex justify-center", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setVisibleCount((count) => count + 6), className: "rounded-full border border-border bg-card px-5 py-3 text-[13px] font-semibold text-[#292525] transition-colors hover:bg-beige/60", children: "Load More" }) }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "mt-10 rounded-[24px] border border-sand/70 bg-card/70 p-6 shadow-soft backdrop-blur-xl", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-5", children: TRUST_POINTS.map(({ icon: Icon, label }) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2 text-center", children: [
      /* @__PURE__ */ jsx("span", { className: "grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-beige to-[#F3E7D3] text-[#292525] ring-1 ring-inset ring-sand", children: /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-[12px] font-medium text-[#292525]", children: label })
    ] }, label)) }) }),
    /* @__PURE__ */ jsxs(
      motion.button,
      {
        type: "button",
        onClick: () => setAiMatchOpen(true),
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.96 },
        className: "fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7A2348] to-[#E8C7CF] px-5 py-3.5 text-[13px] font-semibold text-white shadow-[0_20px_45px_rgba(122,35,72,0.35)]",
        children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
          " Petalieee AI"
        ]
      }
    ),
    /* @__PURE__ */ jsx(AnimatePresence, { children: aiMatchOpen ? /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { opacity: 0, y: 20, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 20, scale: 0.96 },
        className: "fixed bottom-24 right-6 z-40 w-[340px] rounded-[24px] border border-sand/70 bg-card p-5 shadow-[0_30px_70px_rgba(10,7,4,0.25)]",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx("span", { className: "grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#7A2348] to-[#E8C7CF] text-white", children: /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-display text-sm font-semibold text-[#292525]", children: "Petalieee AI" }),
                /* @__PURE__ */ jsx("p", { className: "text-[11.5px] text-taupe", children: "Tell me about your event." })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setAiMatchOpen(false), className: "text-taupe hover:text-[#7A2348]", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "mb-1.5 text-[11px] uppercase tracking-[0.14em] text-taupe", children: "Event type" }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1.5", children: ["Wedding", "Corporate", "Birthday", "Reception"].map((type) => /* @__PURE__ */ jsx("span", { className: "rounded-full border border-border bg-beige/60 px-2.5 py-1 text-[11.5px] text-[#292525]", children: type }, type)) })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "block", children: [
              /* @__PURE__ */ jsx("span", { className: "mb-1 block text-[11px] uppercase tracking-[0.14em] text-taupe", children: "Budget" }),
              /* @__PURE__ */ jsx("input", { type: "text", placeholder: "\u20B9 5,00,000", className: "w-full rounded-xl border border-border bg-beige/50 px-3 py-2 text-[13px] text-[#292525] placeholder:text-taupe focus:outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "block", children: [
              /* @__PURE__ */ jsx("span", { className: "mb-1 block text-[11px] uppercase tracking-[0.14em] text-taupe", children: "Guests" }),
              /* @__PURE__ */ jsx("input", { type: "text", placeholder: "250", className: "w-full rounded-xl border border-border bg-beige/50 px-3 py-2 text-[13px] text-[#292525] placeholder:text-taupe focus:outline-none" })
            ] }),
            /* @__PURE__ */ jsxs("label", { className: "block", children: [
              /* @__PURE__ */ jsx("span", { className: "mb-1 block text-[11px] uppercase tracking-[0.14em] text-taupe", children: "Location" }),
              /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Bengaluru", className: "w-full rounded-xl border border-border bg-beige/50 px-3 py-2 text-[13px] text-[#292525] placeholder:text-taupe focus:outline-none" })
            ] }),
            /* @__PURE__ */ jsx("button", { type: "button", disabled: aiLoading, onClick: async () => {
              setAiLoading(true);
              try {
                const res = await base44.integrations.Core.InvokeLLM({
                  prompt: "Suggest 3 vendor categories to prioritize for a premium event in India. Keep each suggestion to 3-4 words.",
                  response_json_schema: { type: "object", properties: { suggestions: { type: "array", items: { type: "string" } } } }
                });
                toast({ title: "Petalieee AI recommends", description: (res.suggestions || ["Photography", "Catering", "Venues"]).join(", ") });
              } catch { toast({ title: "AI unavailable", description: "Please try again later." }); }
              finally { setAiLoading(false); }
            }, className: "w-full rounded-full bg-[#7A2348] py-2.5 text-[12.5px] font-semibold text-ivory transition-colors hover:bg-[#7A2348]/90 disabled:opacity-60", children: aiLoading ? "Finding vendors\u2026" : "Find my vendors" })
          ] })
        ]
      }
    ) : null }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: contactVendor ? /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 flex justify-end bg-[#7A2348]/60 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(
      motion.div,
      {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
        transition: { type: "spring", damping: 28, stiffness: 260 },
        className: "h-full w-full max-w-sm overflow-y-auto border-l border-border bg-card p-6 shadow-[0_0_60px_rgba(10,7,4,0.3)]",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("p", { className: "font-display text-lg font-semibold text-[#292525]", children: "Quick contact" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setContactVendor(null), className: "text-taupe hover:text-[#7A2348]", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center gap-3 rounded-2xl border border-border bg-beige/40 p-3", children: [
            /* @__PURE__ */ jsx("img", { src: contactVendor.image, alt: contactVendor.name, className: "h-14 w-14 rounded-xl object-cover" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-[#292525]", children: contactVendor.name }),
              /* @__PURE__ */ jsxs("p", { className: "text-[12px] text-taupe", children: [
                contactVendor.categoryLabel ?? contactVendor.category,
                " \xB7 ",
                contactVendor.city
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxs("button", { className: "flex items-center justify-center gap-2 rounded-2xl border border-border bg-beige/50 py-3 text-[12.5px] font-semibold text-[#292525] hover:bg-beige", children: [
              /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4" }),
              " Call"
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "flex items-center justify-center gap-2 rounded-2xl border border-border bg-beige/50 py-3 text-[12.5px] font-semibold text-[#292525] hover:bg-beige", children: [
              /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4" }),
              " WhatsApp"
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "flex items-center justify-center gap-2 rounded-2xl border border-border bg-beige/50 py-3 text-[12.5px] font-semibold text-[#292525] hover:bg-beige", children: [
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" }),
              " Message"
            ] }),
            /* @__PURE__ */ jsxs("button", { className: "flex items-center justify-center gap-2 rounded-2xl border border-border bg-beige/50 py-3 text-[12.5px] font-semibold text-[#292525] hover:bg-beige", children: [
              /* @__PURE__ */ jsx(Video, { className: "h-4 w-4" }),
              " Book Meeting"
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setSelectedVendor(contactVendor);
                setContactVendor(null);
              },
              className: "mt-5 w-full rounded-full bg-[#7A2348] py-2.5 text-[12.5px] font-semibold text-ivory hover:bg-[#7A2348]/90",
              children: "View full profile"
            }
          )
        ]
      }
    ) }) : null }),
    /* @__PURE__ */ jsx(AnimatePresence, { children: selectedVendor ? /* @__PURE__ */ jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#7A2348]/70 px-4 py-6 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(motion.div, { initial: { opacity: 0, y: 24, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 20, scale: 0.98 }, className: "relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_30px_90px_rgba(10,7,4,0.35)]", children: [
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setSelectedVendor(null), className: "absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[#292525] shadow-soft backdrop-blur", children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid max-h-[90vh] lg:grid-cols-[1.1fr_0.9fr]", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative min-h-[260px] bg-gradient-to-br from-[#F7EEDC] to-[#FFFDFC]", children: [
          /* @__PURE__ */ jsx("img", { src: selectedVendor.image, alt: selectedVendor.name, className: "h-full w-full object-cover" }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-[#180f0b]/70 via-transparent to-transparent" }),
          /* @__PURE__ */ jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-6 text-ivory", children: [
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] backdrop-blur", children: [
              /* @__PURE__ */ jsx(BadgeCheck, { className: "h-3.5 w-3.5" }),
              " Listed vendor"
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "mt-3 font-display text-3xl font-semibold", children: selectedVendor.name }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-xl text-sm text-[#f5ebdc]", children: selectedVendor.description })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "min-h-0 overflow-y-auto p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-beige px-3 py-1 text-[12px] font-semibold text-[#292525]", children: selectedVendor.categoryLabel ?? selectedVendor.category }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-cream px-3 py-1 text-[12px] font-semibold text-[#292525]", children: selectedVendor.city }),
            /* @__PURE__ */ jsx("span", { className: "rounded-full bg-[#F3E7D3] px-3 py-1 text-[12px] font-semibold text-[#7A2348]", children: selectedVendor.match ? `AI Match ${selectedVendor.match}%` : "Direct listing" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-[16px] border border-border bg-beige/50 p-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.18em] text-taupe", children: "Starting Price" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 font-semibold text-[#292525]", children: selectedVendor.price })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-[16px] border border-border bg-beige/50 p-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.18em] text-taupe", children: "Response" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 font-semibold text-[#292525]", children: selectedVendor.responseTime })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-[16px] border border-border bg-beige/50 p-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-[11px] uppercase tracking-[0.18em] text-taupe", children: "Availability" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 font-semibold text-[#292525]", children: selectedVendor.availability })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-5", children: [
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-taupe", children: "Gallery" }),
              /* @__PURE__ */ jsx("div", { className: "mt-3 grid gap-2 sm:grid-cols-3", children: selectedVendor.gallery.map((image) => /* @__PURE__ */ jsx("img", { src: image, alt: selectedVendor.name, className: "h-24 w-full rounded-[14px] object-cover" }, image)) })
            ] }),
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-taupe", children: "Services" }),
              /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: selectedVendor.services.map((service) => /* @__PURE__ */ jsx("span", { className: "rounded-full border border-border bg-card px-3 py-1.5 text-[12px] text-[#292525]", children: service }, service)) })
            ] }),
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-taupe", children: "About" }),
              /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-6 text-taupe", children: selectedVendor.description })
            ] }),
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-taupe", children: "Pricing" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-[16px] border border-border bg-beige/50 p-4 text-sm text-[#292525]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("span", { children: "Starting package" }),
                  /* @__PURE__ */ jsx("span", { className: "font-semibold", children: selectedVendor.price })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between text-taupe", children: [
                  /* @__PURE__ */ jsx("span", { children: "Estimated event budget" }),
                  /* @__PURE__ */ jsx("span", { children: "Flexible by scale" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-taupe", children: "Reviews" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 rounded-[16px] border border-border bg-beige/50 p-4 text-sm text-[#292525]", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-[#7A2348] text-[#7A2348]" }),
                  /* @__PURE__ */ jsxs("span", { className: "font-semibold", children: [
                    selectedVendor.rating.toFixed(1),
                    " \xB7 ",
                    selectedVendor.reviews,
                    "+ reviews"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-6 text-taupe", children: selectedVendor.review })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-semibold uppercase tracking-[0.16em] text-taupe", children: "Contact" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setBookingVendor(selectedVendor), className: "rounded-full bg-[linear-gradient(135deg,var(--champagne),var(--bronze))] px-4 py-2 text-[12px] font-semibold text-[#292525] shadow-gold", children: "Book Now" }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: async () => {
                  try {
                    await base44.messages.send({ vendor_id: selectedVendor.id || selectedVendor.name, vendor_name: selectedVendor.name, body: `Hi! I'm interested in ${selectedVendor.category.toLowerCase()} services for my event.` });
                    toast({ title: "Message sent!", description: `Opening your conversation with ${selectedVendor.name}\u2026` });
                    navigate("/messages");
                  } catch (err) { toast({ title: "Please log in to message vendors", description: err.message }); navigate("/login"); }
                }, className: "rounded-full border border-border bg-card px-4 py-2 text-[12px] font-semibold text-[#292525]", children: "Message" }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: async () => {
                  try {
                    await base44.entities.Inquiry.create({ name: "Quote Request", email: "noreply@eventneve.io", message: `Requesting a quote from ${selectedVendor.name} (${selectedVendor.category}, ${selectedVendor.city})`, event_type: "Other", status: "New" });
                    toast({ title: "Quote request sent!", description: `${selectedVendor.name} will respond shortly.` });
                  } catch { toast({ title: "Failed to send request" }); }
                }, className: "rounded-full bg-[#7A2348] px-4 py-2 text-[12px] font-semibold text-ivory", children: "Request Quote" }),
                /* @__PURE__ */ jsx("button", { type: "button", onClick: async () => {
                  try {
                    await base44.entities.Inquiry.create({ name: "Call Request", email: "noreply@eventneve.io", message: `Requesting a call with ${selectedVendor.name} (${selectedVendor.category}, ${selectedVendor.city})`, event_type: "Other", status: "New" });
                    toast({ title: "Call request sent!", description: `${selectedVendor.name} will contact you soon.` });
                  } catch { toast({ title: "Failed to schedule call" }); }
                }, className: "rounded-full border border-border bg-card px-4 py-2 text-[12px] font-semibold text-[#292525]", children: "Schedule a Call" })
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }) }) : null }),
    bookingVendor ? /* @__PURE__ */ jsx(BookingModal, { vendor: bookingVendor, onClose: () => setBookingVendor(null) }) : null
  ] });
}
function FilterGroup({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-5 border-b border-border pb-5 last:mb-0 last:border-b-0 last:pb-0", children: [
    /* @__PURE__ */ jsx("h4", { className: "text-[11px] font-semibold uppercase tracking-[0.14em] text-taupe", children: title }),
    /* @__PURE__ */ jsx("div", { className: "mt-2", children })
  ] });
}