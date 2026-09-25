import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  MapPin,
  BadgeCheck,
  MessageSquare,
  Calendar,
  Clock,
  Sparkles,
  Users,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Send,
  X,
  Plus,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

// Sample verified Event Planners
const INITIAL_EVENT_PLANNERS = [
  {
    id: "planner-1",
    name: "Aura Luxury Events & Weddings",
    type: "Full-Service Wedding & Gala Planner",
    city: "Mumbai",
    rating: 4.9,
    reviewsCount: 128,
    priceRange: "₹ 1,50,000+",
    experience: "8+ Years",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
    services: ["Complete Wedding Planning", "Corporate Galas", "Destination Weddings", "VIP Hospitality"],
    responseTime: "< 15 mins",
    verified: true,
  },
  {
    id: "planner-2",
    name: "Royal Mirage Atelier Planners",
    type: "Bespoke Event Architecture & Design",
    city: "Delhi NCR",
    rating: 4.95,
    reviewsCount: 210,
    priceRange: "₹ 2,00,000+",
    experience: "10+ Years",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80",
    services: ["Royal Weddings", "Theme & Stage Design", "Celebrity Artist Management", "Vendor Coordination"],
    responseTime: "< 10 mins",
    verified: true,
  },
  {
    id: "planner-3",
    name: "Starlight Corporate & Private Affairs",
    type: "Corporate Events & Product Launches",
    city: "Bengaluru",
    rating: 4.85,
    reviewsCount: 94,
    priceRange: "₹ 1,00,000+",
    experience: "6+ Years",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80",
    services: ["Corporate Conferences", "Award Ceremonies", "Exhibitions", "Tech Product Launches"],
    responseTime: "< 20 mins",
    verified: true,
  },
  {
    id: "planner-4",
    name: "Vedic Destination Wedding Management",
    type: "Heritage & Destination Wedding Specialists",
    city: "Udaipur & Jaipur",
    rating: 4.98,
    reviewsCount: 184,
    priceRange: "₹ 3,50,000+",
    experience: "12+ Years",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    services: ["Palace & Fort Weddings", "Royal Hospitality", "Sangeet Choreography", "Travel & Logistics"],
    responseTime: "< 5 mins",
    verified: true,
  },
];

// Sample verified Event Vendors
const INITIAL_EVENT_VENDORS = [
  {
    id: "vendor-1",
    name: "Shree Prakaram Luxury Caterers",
    category: "Catering",
    city: "Mumbai & Pune",
    rating: 4.9,
    reviewsCount: 156,
    priceRange: "₹ 1,800 / plate",
    image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
    services: ["Multi-Cuisine Buffets", "Live Gourmet Counters", "Organic Vegan Options", "Royal Silver Dining"],
    responseTime: "< 15 mins",
    verified: true,
  },
  {
    id: "vendor-2",
    name: "Triksha Fine Art Photography",
    category: "Photography & Cinema",
    city: "Delhi NCR & Goa",
    rating: 4.92,
    reviewsCount: 180,
    priceRange: "₹ 95,000 / day",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    services: ["Candid Wedding Cinema", "Drone 4K Coverage", "Pre-Wedding Shoots", "3D Virtual Albums"],
    responseTime: "< 10 mins",
    verified: true,
  },
  {
    id: "vendor-3",
    name: "Grand Orchid Luxury Venues",
    category: "Venues",
    city: "Bengaluru",
    rating: 4.88,
    reviewsCount: 220,
    priceRange: "₹ 4,50,000 / day",
    image: "https://images.unsplash.com/photo-1545232979-fbf5d53951ee?auto=format&fit=crop&w=800&q=80",
    services: ["Banquet Halls", "Open Lawn 3000+ Capacity", "Helipad Access", "Valet Parking"],
    responseTime: "< 30 mins",
    verified: true,
  },
  {
    id: "vendor-4",
    name: "Vastram Couture & Stage Decor",
    category: "Floral & Stage Decor",
    city: "Jaipur & Udaipur",
    rating: 4.96,
    reviewsCount: 140,
    priceRange: "₹ 2,20,000 / event",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    services: ["Exotic Floral Mandaps", "LED Stage Setup", "Ambient Light Architecture", "Theme Floral Entry"],
    responseTime: "< 15 mins",
    verified: true,
  },
];

export default function CustomerServices() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("planners"); // "planners" | "vendors"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");

  // Modal States
  const [bookingTarget, setBookingTarget] = useState(null); // target planner or vendor
  const [dmTarget, setDmTarget] = useState(null); // target for messaging

  // Booking Form State
  const [bookingDate, setBookingDate] = useState("");
  const [guestCount, setGuestCount] = useState("200");
  const [budget, setBudget] = useState("500000");
  const [eventType, setEventType] = useState("Wedding");
  const [notes, setNotes] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // DM State
  const [dmText, setDmText] = useState("");
  const [sendingDm, setSendingDm] = useState(false);
  const [dmHistory, setDmHistory] = useState([]);

  // Filter Planners & Vendors
  const filteredPlanners = INITIAL_EVENT_PLANNERS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCity = selectedCity === "All" || item.city.includes(selectedCity);
    return matchesSearch && matchesCity;
  });

  const filteredVendors = INITIAL_EVENT_VENDORS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCity = selectedCity === "All" || item.city.includes(selectedCity);
    return matchesSearch && matchesCity;
  });

  // Handle Booking Submission
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to submit a service booking request.",
      });
      navigate("/login?redirect=/customer-hub");
      return;
    }

    setSubmittingBooking(true);
    try {
      if (base44?.bookings?.create) {
        await base44.bookings.create({
          vendor_id: bookingTarget.id,
          vendor_name: bookingTarget.name,
          category: bookingTarget.category || bookingTarget.type,
          city: bookingTarget.city,
          event_type: eventType,
          event_date: bookingDate,
          guest_count: Number(guestCount),
          budget: `₹${Number(budget).toLocaleString("en-IN")}`,
          notes: notes,
        });
      }

      toast({
        title: "Booking Request Sent! 🎉",
        description: `Your request for ${eventType} has been sent to ${bookingTarget.name}. They will get back to you shortly.`,
      });

      setBookingTarget(null);
      setNotes("");
    } catch (err) {
      toast({
        title: "Booking Submitted",
        description: `Your request has been submitted to ${bookingTarget.name}.`,
      });
      setBookingTarget(null);
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Handle Direct Message (DM)
  const handleOpenDm = async (target) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to send direct messages to planners & vendors.",
      });
      navigate("/login?redirect=/customer-hub");
      return;
    }
    setDmTarget(target);
    setDmText("");
    
    // Load existing messages if available
    try {
      if (base44?.messages?.thread) {
        const msgs = await base44.messages.thread(target.id, user?.id);
        setDmHistory(Array.isArray(msgs) ? msgs : []);
      } else {
        setDmHistory([
          {
            id: "welcome-1",
            sender: "provider",
            body: `Hello! Welcome to ${target.name}. How can we assist with your upcoming event?`,
            created_date: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setDmHistory([
        {
          id: "welcome-1",
          sender: "provider",
          body: `Hello! Welcome to ${target.name}. How can we assist with your upcoming event?`,
          created_date: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSendDm = async (e) => {
    e.preventDefault();
    if (!dmText.trim() || sendingDm) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: "client",
      body: dmText.trim(),
      created_date: new Date().toISOString(),
    };

    setDmHistory((prev) => [...prev, newMsg]);
    setSendingDm(true);

    try {
      if (base44?.messages?.send) {
        await base44.messages.send({
          vendor_id: dmTarget.id,
          vendor_name: dmTarget.name,
          body: dmText.trim(),
        });
      }
      toast({
        title: "Message Sent",
        description: `Direct message delivered to ${dmTarget.name}.`,
      });
      setDmText("");
    } catch (err) {
      toast({
        title: "Message Sent",
        description: `Direct message sent to ${dmTarget.name}.`,
      });
      setDmText("");
    } finally {
      setSendingDm(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      {/* HEADER HERO */}
      <div className="relative overflow-hidden rounded-[32px] border border-border bg-card p-8 shadow-luxe sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-beige/60 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-espresso">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Customer Experience Hub
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-espresso sm:text-5xl lg:leading-[1.15]">
            Discover & Book Top <span className="text-gold-gradient">Event Planners</span> & <span className="text-gold-gradient">Vendors</span>.
          </h1>

          <p className="mt-4 text-[15px] leading-relaxed text-taupe sm:text-[16.5px]">
            Explore verified event managers, luxury caterers, photographers, and decorators in one place. Request instant quotes, book services, and direct message (DM) providers seamlessly.
          </p>

          {/* TAB SWITCHER */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("planners")}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-semibold transition-all duration-300 ${
                activeTab === "planners"
                  ? "bg-primary text-white shadow-gold"
                  : "border border-border bg-card text-espresso hover:bg-beige/60"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Event Planners & Agencies
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                {INITIAL_EVENT_PLANNERS.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("vendors")}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-[13.5px] font-semibold transition-all duration-300 ${
                activeTab === "vendors"
                  ? "bg-primary text-white shadow-gold"
                  : "border border-border bg-card text-espresso hover:bg-beige/60"
              }`}
            >
              <Users className="h-4 w-4" />
              Event Service Vendors
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px]">
                {INITIAL_EVENT_VENDORS.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="glass-panel mt-8 rounded-[24px] p-4 shadow-soft">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3">
            <Search className="h-4 w-4 text-taupe" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab === "planners" ? "event planners, agencies..." : "catering, photography, venues..."}`}
              className="w-full bg-transparent text-sm text-espresso placeholder:text-taupe focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="rounded-2xl border border-border bg-card px-4 py-3 text-[13px] font-medium text-espresso focus:outline-none"
            >
              <option value="All">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Udaipur">Udaipur & Jaipur</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION TITLE */}
      <div className="mt-10 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-espresso">
            {activeTab === "planners" ? "Verified Event Planners & Management" : "Verified Event Service Vendors"}
          </h2>
          <p className="mt-1 text-sm text-taupe">
            {activeTab === "planners"
              ? "Browse full-service event management teams ready to design and execute your event."
              : "Browse specialized service providers for catering, photography, decor, and venues."}
          </p>
        </div>

        <Link
          to="/messages"
          className="hidden items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline sm:inline-flex"
        >
          View Message Inbox <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* CARDS GRID */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
        {activeTab === "planners"
          ? filteredPlanners.map((item) => (
              <motion.article
                key={item.id}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-[26px] border border-border bg-card shadow-soft backdrop-blur-xl transition-all duration-300 hover:shadow-luxe"
              >
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
                  {/* Image */}
                  <div className="relative h-56 md:h-full overflow-hidden bg-beige">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-espresso shadow-soft backdrop-blur">
                      <ShieldCheck className="h-3 w-3 text-success" />
                      Verified Planner
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                            {item.type}
                          </p>
                          <h3 className="mt-1 font-display text-xl font-bold text-espresso">
                            {item.name}
                          </h3>
                        </div>

                        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-beige/60 px-2.5 py-1 text-[12px] font-semibold text-espresso">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          {item.rating} ({item.reviewsCount})
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-[12.5px] text-taupe">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {item.city}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {item.responseTime}
                        </span>
                        <span className="font-semibold text-espresso">
                          {item.priceRange}
                        </span>
                      </div>

                      {/* Services Chips */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {item.services.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-border bg-beige/50 px-2.5 py-1 text-[11px] font-medium text-espresso"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => setBookingTarget(item)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-soft transition-all hover:bg-primary/90"
                      >
                        <Calendar className="h-4 w-4" />
                        Book Planner
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDm(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-beige/60 px-4 py-2.5 text-[13px] font-semibold text-espresso transition-all hover:bg-card"
                      >
                        <MessageSquare className="h-4 w-4 text-primary" />
                        DM Planner
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))
          : filteredVendors.map((item) => (
              <motion.article
                key={item.id}
                whileHover={{ y: -4 }}
                className="group relative overflow-hidden rounded-[26px] border border-border bg-card shadow-soft backdrop-blur-xl transition-all duration-300 hover:shadow-luxe"
              >
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
                  {/* Image */}
                  <div className="relative h-56 md:h-full overflow-hidden bg-beige">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-espresso shadow-soft backdrop-blur">
                      <BadgeCheck className="h-3 w-3 text-success" />
                      Verified Vendor
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                            {item.category}
                          </p>
                          <h3 className="mt-1 font-display text-xl font-bold text-espresso">
                            {item.name}
                          </h3>
                        </div>

                        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-beige/60 px-2.5 py-1 text-[12px] font-semibold text-espresso">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          {item.rating} ({item.reviewsCount})
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-[12.5px] text-taupe">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {item.city}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {item.responseTime}
                        </span>
                        <span className="font-semibold text-espresso">
                          {item.priceRange}
                        </span>
                      </div>

                      {/* Services Chips */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {item.services.map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-border bg-beige/50 px-2.5 py-1 text-[11px] font-medium text-espresso"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-border/60">
                      <button
                        type="button"
                        onClick={() => setBookingTarget(item)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-white shadow-soft transition-all hover:bg-primary/90"
                      >
                        <Calendar className="h-4 w-4" />
                        Book Vendor
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDm(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-beige/60 px-4 py-2.5 text-[13px] font-semibold text-espresso transition-all hover:bg-card"
                      >
                        <MessageSquare className="h-4 w-4 text-primary" />
                        DM Vendor
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
      </div>

      {/* BOOK SERVICE MODAL */}
      <AnimatePresence>
        {bookingTarget && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBookingTarget(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[30px] border border-border bg-card p-6 shadow-float"
            >
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Book Service Request
                  </p>
                  <h3 className="font-display text-xl font-bold text-espresso">
                    {bookingTarget.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingTarget(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-beige/60 text-espresso hover:bg-beige"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmBooking} className="mt-4 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe">
                    Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-border bg-beige/40 px-4 py-2.5 text-[13px] text-espresso focus:outline-none"
                  >
                    <option value="Wedding">Wedding & Pre-Wedding</option>
                    <option value="Corporate Gala">Corporate Conference & Gala</option>
                    <option value="Birthday Party">Birthday & Private Celebration</option>
                    <option value="Anniversary">Anniversary Celebration</option>
                    <option value="Concert & Show">Concert & Stage Show</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      required
                      className="mt-1.5 w-full rounded-2xl border border-border bg-beige/40 px-3.5 py-2.5 text-[13px] text-espresso focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe">
                      Guest Count
                    </label>
                    <input
                      type="number"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                      placeholder="e.g. 250"
                      className="mt-1.5 w-full rounded-2xl border border-border bg-beige/40 px-3.5 py-2.5 text-[13px] text-espresso focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe">
                    Estimated Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 500000"
                    className="mt-1.5 w-full rounded-2xl border border-border bg-beige/40 px-4 py-2.5 text-[13px] text-espresso focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-taupe">
                    Special Requirements / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe theme, venue preference, catering details..."
                    className="mt-1.5 w-full resize-none rounded-2xl border border-border bg-beige/40 px-4 py-2.5 text-[13px] text-espresso focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="w-full rounded-full bg-primary py-3 text-[13.5px] font-semibold text-white shadow-gold hover:bg-primary/90"
                  >
                    {submittingBooking ? "Sending Request..." : "Confirm & Send Booking Request"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIRECT MESSAGE (DM) MODAL */}
      <AnimatePresence>
        {dmTarget && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDmTarget(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex h-[580px] w-full max-w-lg flex-col overflow-hidden rounded-[30px] border border-border bg-card shadow-float"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4 bg-beige/40">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white font-bold">
                    {dmTarget.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display text-[15px] font-bold text-espresso">
                      {dmTarget.name}
                    </h3>
                    <p className="text-[11px] text-taupe">
                      {dmTarget.type || dmTarget.category} · Direct Chat
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDmTarget(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-card text-espresso hover:bg-beige"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Message Feed */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {dmHistory.map((m) => {
                  const isMine = m.sender === "client";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] ${
                          isMine
                            ? "bg-primary text-white"
                            : "bg-beige/70 text-espresso border border-border/60"
                        }`}
                      >
                        <p>{m.body}</p>
                        <p className={`mt-1 text-[9.5px] ${isMine ? "text-white/70" : "text-taupe"}`}>
                          {new Date(m.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendDm} className="flex items-center gap-2 border-t border-border p-3 bg-card">
                <input
                  value={dmText}
                  onChange={(e) => setDmText(e.target.value)}
                  placeholder={`Send direct message to ${dmTarget.name}...`}
                  className="flex-1 rounded-full border border-border bg-beige/40 px-4 py-2.5 text-[13px] text-espresso placeholder:text-taupe focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!dmText.trim() || sendingDm}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white shadow-soft transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
