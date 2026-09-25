import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import VendorLayout from "@/components/VendorLayout";
import { Loader2, Plus, Trash2, ImagePlus, Store, Upload, CalendarDays, Star, MessageSquare, BriefcaseBusiness, BarChart3, Inbox, CheckCircle2 } from "lucide-react";

const CATEGORIES = [
  "Decorator",
  "Caterer",
  "Photographer",
  "AV / Sound",
  "Florist",
  "Entertainment",
  "Venue",
  "Makeup & Styling",
  "Other",
];

const emptyService = () => ({ name: "", description: "", price_range: "" });

const emptyForm = () => ({
  name: "",
  city: "",
  category: "",
  description: "",
  service_offerings: [emptyService()],
  contact: { phone: "", email: "", whatsapp: "" },
  gallery: [],
  is_available: true,
});

export default function VendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileInputRef] = useState(() => React.createRef());
  const [blockedDates, setBlockedDates] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    base44.vendorProfile
      .get()
      .then((profile) => {
        setForm({
          name: profile.name || "",
          city: profile.city || "",
          category: profile.category || "",
          description: profile.description || "",
          service_offerings:
            profile.service_offerings?.length ? profile.service_offerings : [emptyService()],
          contact: {
            phone: profile.contact?.phone || "",
            email: profile.contact?.email || "",
            whatsapp: profile.contact?.whatsapp || "",
          },
          gallery: profile.gallery || [],
          is_available: profile.is_available ?? true,
        });
        setBlockedDates(profile.blocked_dates || []);
        setIsNew(false);

        const vId = profile.id || profile.vendor_id;
        if (vId) {
          base44.reviews.getForVendor(vId).then((revs) => {
            if (Array.isArray(revs)) setReviewsList(revs);
          }).catch(() => {});
        }
      })
      .catch((err) => {
        // 404 just means they haven't created a profile yet — that's fine
        if (err.status !== 404) {
          setError(err.message || "Couldn't load your vendor profile");
        }
        setIsNew(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateService = (index, field, value) => {
    setForm((f) => {
      const service_offerings = [...f.service_offerings];
      service_offerings[index] = { ...service_offerings[index], [field]: value };
      return { ...f, service_offerings };
    });
  };

  const addService = () => {
    setForm((f) => ({ ...f, service_offerings: [...f.service_offerings, emptyService()] }));
  };

  const removeService = (index) => {
    setForm((f) => ({
      ...f,
      service_offerings: f.service_offerings.filter((_, i) => i !== index),
    }));
  };

  const addGalleryUrl = () => {
    const url = galleryUrlInput.trim();
    if (!url) return;
    setForm((f) => ({ ...f, gallery: [...f.gallery, url] }));
    setGalleryUrlInput("");
  };

  const removeGalleryUrl = (index) => {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;

    setUploading(true);
    try {
      const url = await base44.vendorProfile.uploadPhoto(file);
      setForm((f) => ({ ...f, gallery: [...f.gallery, url] }));
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleAvailability = async (checked) => {
    setForm((f) => ({ ...f, is_available: checked }));
    // If the profile already exists, save this immediately — it's meant to
    // be a quick on/off switch, not something you save-and-wait for.
    if (!isNew) {
      try {
        await base44.vendorProfile.setAvailability(checked);
      } catch (err) {
        setForm((f) => ({ ...f, is_available: !checked })); // revert on failure
        toast({ title: "Couldn't update availability", description: err.message, variant: "destructive" });
      }
    }
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    city: form.city.trim(),
    category: form.category,
    description: form.description.trim() || undefined,
    service_offerings: form.service_offerings
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        description: s.description?.trim() || undefined,
        price_range: s.price_range.trim(),
      })),
    contact: {
      phone: form.contact.phone.trim() || undefined,
      email: form.contact.email.trim() || undefined,
      whatsapp: form.contact.whatsapp.trim() || undefined,
    },
    gallery: form.gallery,
    is_available: form.is_available,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.city.trim() || !form.category) {
      setError("Business name, city, and category are required.");
      return;
    }
    if (form.service_offerings.some((s) => s.name.trim() && !s.price_range.trim())) {
      setError("Every service needs a price range — or remove the empty one.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      const saved = isNew
        ? await base44.vendorProfile.create(payload)
        : await base44.vendorProfile.update(payload);
      setIsNew(false);
      toast({ title: isNew ? "Profile created" : "Profile updated" });
      setForm((f) => ({ ...f, ...saved }));
    } catch (err) {
      setError(err.message || "Couldn't save your profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout active="Dashboard">
        <div className="min-h-screen bg-[#F3E7D3] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7A2348]" />
        </div>
      </VendorLayout>
    );
  }

  const navItems = [
    { id: "overview", label: "Dashboard", Icon: Store },
    { id: "listing", label: "My Listing", Icon: BriefcaseBusiness },
    { id: "inquiries", label: "Inquiries", Icon: Inbox },
    { id: "bookings", label: "Bookings", Icon: CalendarDays },
    { id: "availability", label: "Availability", Icon: CalendarDays },
    { id: "messages", label: "Messages", Icon: MessageSquare },
    { id: "reviews", label: "Reviews", Icon: Star },
    { id: "analytics", label: "Analytics", Icon: BarChart3 },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(`vendor-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const profileCompletion = Math.round(
    [
      form.name.trim(),
      form.city.trim(),
      form.category,
      form.description.trim(),
      form.contact.phone.trim(),
      form.contact.email.trim(),
      form.gallery.length > 0,
      form.service_offerings.some((s) => s.name.trim()),
    ].filter(Boolean).length * 12.5
  );

  return (
    <VendorLayout active="Dashboard">
      <div className="min-h-screen bg-[#F3E7D3] text-[#292525]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A2348]/65">
                Vendor workspace
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#7A2348]">
                {form.name || "Vendor Dashboard"}
              </h1>
              <p className="mt-2 text-sm text-[#6F6265]">
                Manage your listing, inquiries, bookings, availability and customer reviews.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className={`rounded-full border px-3 py-2 text-xs font-bold ${
                form.is_available
                  ? "border-[#7A2348]/20 bg-[#7A2348]/8 text-[#7A2348]"
                  : "border-[#6F6265]/20 bg-[#6F6265]/8 text-[#6F6265]"
              }`}>
                {form.is_available ? "Available for bookings" : "Currently unavailable"}
              </div>
              <Button
                type="button"
                className="bg-[#7A2348] text-white hover:bg-[#5A1835]"
                onClick={() => scrollToSection("listing")}
              >
                Edit listing
              </Button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="flex min-w-max gap-2 rounded-2xl border border-[#7A2348]/12 bg-[#F3E7D3] p-2">
              {navItems.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    activeSection === id
                      ? "bg-[#7A2348] text-white"
                      : "text-[#7A2348] hover:bg-[#7A2348]/8"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard */}
          <section id="vendor-overview" className="mt-6 scroll-mt-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Profile completion", `${profileCompletion}%`, CheckCircle2],
                ["Services", form.service_offerings.filter((s) => s.name.trim()).length, BriefcaseBusiness],
                ["Portfolio photos", form.gallery.length, ImagePlus],
                ["Reviews", reviewsList.length, Star],
              ].map(([label, value, Icon]) => (
                <div key={label} className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7A2348]/60">
                      {label}
                    </p>
                    <Icon className="h-4 w-4 text-[#7A2348]" />
                  </div>
                  <p className="mt-4 text-3xl font-extrabold text-[#7A2348]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7A2348]/60">
                  Marketplace listing
                </p>
                <h2 className="mt-1 text-xl font-bold">{form.name || "Complete your vendor profile"}</h2>
                <p className="mt-1 text-sm text-[#6F6265]">
                  {form.category || "Choose a category"}{form.city ? ` · ${form.city}` : ""}
                </p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#EBD9BC]">
                  <div className="h-full rounded-full bg-[#7A2348]" style={{ width: `${profileCompletion}%` }} />
                </div>
                <button
                  type="button"
                  onClick={() => scrollToSection("listing")}
                  className="mt-4 text-xs font-bold text-[#7A2348] hover:underline"
                >
                  Manage my listing →
                </button>
              </div>

              <div className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7A2348]/60">
                  Availability
                </p>
                <p className="mt-2 text-lg font-bold">
                  {form.is_available ? "Open for new bookings" : "Not accepting bookings"}
                </p>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#7A2348]/10 p-3">
                  <span className="text-xs font-semibold">Accept new inquiries</span>
                  <Switch checked={form.is_available} onCheckedChange={toggleAvailability} />
                </div>
              </div>
            </div>
          </section>

          {/* Inquiries */}
          <section id="vendor-inquiries" className="mt-6 scroll-mt-6">
            <div className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-6">
              <div className="flex items-start gap-3">
                <Inbox className="mt-0.5 h-5 w-5 text-[#7A2348]" />
                <div>
                  <h2 className="text-lg font-bold">Inquiries</h2>
                  <p className="mt-1 text-sm text-[#6F6265]">
                    Real customer and event-planner inquiries will appear here once the inquiry workflow is connected.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-dashed border-[#7A2348]/20 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-[#7A2348]">No inquiries yet</p>
                <p className="mt-1 text-xs text-[#6F6265]">No demo inquiries are shown.</p>
              </div>
            </div>
          </section>

          {/* Bookings */}
          <section id="vendor-bookings" className="mt-6 scroll-mt-6">
            <div className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-6">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-[#7A2348]" />
                <div>
                  <h2 className="text-lg font-bold">Bookings</h2>
                  <p className="mt-1 text-sm text-[#6F6265]">
                    Confirmed vendor bookings will appear here.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-dashed border-[#7A2348]/20 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-[#7A2348]">No bookings yet</p>
                <p className="mt-1 text-xs text-[#6F6265]">No demo bookings are shown.</p>
              </div>
            </div>
          </section>

          {/* Availability */}
          <section id="vendor-availability" className="mt-6 scroll-mt-6">
            <Card className="space-y-4 border-[#E8C7CF] bg-[#F3E7D3] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-[#7A2348]" />
                  <h2 className="text-lg font-semibold">Availability Calendar</h2>
                </div>
                <span className="rounded-full bg-[#7A2348]/10 px-2.5 py-1 text-xs font-semibold text-[#7A2348]">
                  {blockedDates.length} Blocked Date{blockedDates.length === 1 ? "" : "s"}
                </span>
              </div>

              <p className="text-sm text-[#6F6265]">
                Click upcoming dates to block or unblock them.
              </p>

              <div className="grid grid-cols-5 gap-2 pt-2 sm:grid-cols-7">
                {Array.from({ length: 28 }).map((_, idx) => {
                  const d = new Date();
                  d.setDate(d.getDate() + idx);
                  const iso = d.toISOString().split("T")[0];
                  const isBlocked = blockedDates.includes(iso);
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleDateString("en-US", { month: "short" });
                  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });

                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={async () => {
                        const next = isBlocked
                          ? blockedDates.filter((b) => b !== iso)
                          : [...blockedDates, iso];

                        setBlockedDates(next);
                        try {
                          await base44.vendorProfile.updateBlockedDates(next);
                          toast({
                            title: isBlocked ? "Date unblocked" : "Date blocked",
                            description: `Updated availability for ${monthName} ${dayNum}`,
                          });
                        } catch (err) {
                          toast({
                            title: "Failed to update calendar",
                            description: err.message,
                            variant: "destructive",
                          });
                        }
                      }}
                      className={`rounded-xl border p-2.5 text-center transition ${
                        isBlocked
                          ? "border-[#C98AA4] bg-[#F7E8ED] font-bold text-[#7A2348]"
                          : "border-[#E8C7CF] bg-[#F3E7D3] text-[#292525] hover:border-[#7A2348]/50"
                      }`}
                    >
                      <p className="text-[10px] uppercase opacity-70">{weekday}</p>
                      <p className="mt-0.5 text-sm font-bold">{monthName} {dayNum}</p>
                      <p className="mt-1 text-[10px] font-semibold">{isBlocked ? "Blocked" : "Available"}</p>
                    </button>
                  );
                })}
              </div>
            </Card>
          </section>

          {/* My Listing */}
          <section id="vendor-listing" className="mt-6 scroll-mt-6">
            <form onSubmit={handleSave} className="space-y-6">
              {error && (
                <div className="rounded-xl bg-[#7A2348]/10 p-3 text-sm text-[#7A2348]">{error}</div>
              )}

              <Card className="space-y-4 border-[#E8C7CF] bg-[#F3E7D3] p-5">
                <h2 className="font-semibold">Business details</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="biz-name">Business name</Label>
                    <Input id="biz-name" value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Business name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-city">City</Label>
                    <Input id="biz-city" value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Bengaluru" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biz-category">Category</Label>
                  <Select value={form.category}
                    onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}>
                    <SelectTrigger id="biz-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biz-desc">About your business</Label>
                  <Textarea id="biz-desc" value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="A short introduction planners will see on your listing" rows={4} />
                </div>
              </Card>

              <Card className="space-y-4 border-[#E8C7CF] bg-[#F3E7D3] p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Services</h2>
                  <Button type="button" variant="outline" size="sm"
                    className="border-[#E8C7CF] bg-[#F3E7D3] text-[#7A2348] hover:bg-[#E8C7CF]/50"
                    onClick={addService}>
                    <Plus className="mr-1 h-4 w-4" /> Add service
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.service_offerings.map((service, i) => (
                    <div key={i} className="rounded-xl border border-[#E8C7CF] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <Input value={service.name}
                            onChange={(e) => updateService(i, "name", e.target.value)}
                            placeholder="Service name" />
                          <Textarea value={service.description}
                            onChange={(e) => updateService(i, "description", e.target.value)}
                            placeholder="Short description" rows={2} />
                          <Input value={service.price_range}
                            onChange={(e) => updateService(i, "price_range", e.target.value)}
                            placeholder="Price range" />
                        </div>
                        {form.service_offerings.length > 1 && (
                          <Button type="button" variant="ghost" size="icon"
                            onClick={() => removeService(i)} aria-label="Remove service">
                            <Trash2 className="h-4 w-4 text-[#6F6265]" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="space-y-4 border-[#E8C7CF] bg-[#F3E7D3] p-5">
                <h2 className="font-semibold">Contact details</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input id="contact-phone" value={form.contact.phone}
                      onChange={(e) => setForm((f) => ({ ...f, contact: { ...f.contact, phone: e.target.value } }))}
                      placeholder="+91 98765 43210" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" value={form.contact.email}
                      onChange={(e) => setForm((f) => ({ ...f, contact: { ...f.contact, email: e.target.value } }))}
                      placeholder="business@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-whatsapp">WhatsApp</Label>
                    <Input id="contact-whatsapp" value={form.contact.whatsapp}
                      onChange={(e) => setForm((f) => ({ ...f, contact: { ...f.contact, whatsapp: e.target.value } }))}
                      placeholder="+91 98765 43210" />
                  </div>
                </div>
              </Card>

              <Card className="space-y-4 border-[#E8C7CF] bg-[#F3E7D3] p-5">
                <h2 className="font-semibold">Portfolio gallery</h2>

                <div className="flex flex-wrap items-center gap-2">
                  <input ref={fileInputRef} type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden" onChange={handleFileUpload} />
                  <Button type="button" variant="outline"
                    className="border-[#E8C7CF] bg-[#F3E7D3] text-[#7A2348] hover:bg-[#E8C7CF]/50"
                    onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                    {uploading ? "Uploading..." : "Upload a photo"}
                  </Button>
                  <span className="text-xs text-[#6F6265]">JPEG, PNG, WEBP, or GIF — up to 5MB</span>
                </div>

                <div className="flex gap-2">
                  <Input value={galleryUrlInput}
                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                    placeholder="Paste photo URL" />
                  <Button type="button" variant="outline"
                    className="border-[#E8C7CF] bg-[#F3E7D3] text-[#7A2348]"
                    onClick={addGalleryUrl}>
                    <ImagePlus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>

                {form.gallery.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {form.gallery.map((url, i) => (
                      <div key={i} className="group relative">
                        <img src={url} alt="" className="aspect-square w-full rounded-lg border border-[#E8C7CF] object-cover" />
                        <button type="button" onClick={() => removeGalleryUrl(i)}
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#E8C7CF] bg-[#F3E7D3]/95 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label="Remove photo">
                          <Trash2 className="h-3.5 w-3.5 text-[#7A2348]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit"
                  className="h-12 flex-1 bg-[#7A2348] font-semibold text-white hover:bg-[#5A1835]"
                  disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    : isNew ? "Create my profile" : "Save changes"}
                </Button>
                <Button type="button" variant="outline"
                  className="h-12 border-[#7A2348]/25 bg-[#F3E7D3] text-[#7A2348]"
                  onClick={() => scrollToSection("overview")}>
                  Back to dashboard
                </Button>
              </div>
            </form>
          </section>

          {/* Messages */}
          <section id="vendor-messages" className="mt-6 scroll-mt-6">
            <div className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-6">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-[#7A2348]" />
                <div>
                  <h2 className="text-lg font-bold">Messages</h2>
                  <p className="mt-1 text-sm text-[#6F6265]">
                    Conversations with planners and customers will appear here once messaging is connected.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-dashed border-[#7A2348]/20 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-[#7A2348]">No messages yet</p>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section id="vendor-reviews" className="mt-6 scroll-mt-6">
            <Card className="space-y-4 border-[#E8C7CF] bg-[#F3E7D3] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-[#7A2348] text-[#7A2348]" />
                  <h2 className="text-lg font-semibold">Client Reviews</h2>
                </div>
                <span className="rounded-full bg-[#E8C7CF]/40 px-2.5 py-1 text-xs font-semibold text-[#7A2348]">
                  {reviewsList.length} Review{reviewsList.length === 1 ? "" : "s"}
                </span>
              </div>

              {reviewsList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#7A2348]/20 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-[#7A2348]">No reviews yet</p>
                  <p className="mt-1 text-xs text-[#6F6265]">
                    Completed bookings will allow clients to leave ratings and reviews here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="rounded-xl border border-[#E8C7CF] p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[#7A2348]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${
                              i < rev.rating ? "fill-[#7A2348] text-[#7A2348]" : "text-[#6F6265]/30"
                            }`} />
                          ))}
                          <span className="ml-1 text-xs font-bold text-[#292525]">{rev.rating}.0</span>
                        </div>
                        <span className="text-xs text-[#6F6265]">
                          {rev.created_date ? new Date(rev.created_date).toLocaleDateString() : ""}
                        </span>
                      </div>
                      {rev.comment && <p className="mt-2 text-sm text-[#292525]">{rev.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* Analytics */}
          <section id="vendor-analytics" className="mt-6 scroll-mt-6">
            <div className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-6">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-[#7A2348]" />
                <div>
                  <h2 className="text-lg font-bold">Analytics</h2>
                  <p className="mt-1 text-sm text-[#6F6265]">
                    Marketplace performance metrics will appear here when real analytics are available from the backend.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["Profile views", "Inquiries", "Bookings"].map((label) => (
                  <div key={label} className="rounded-xl border border-dashed border-[#7A2348]/20 p-5">
                    <p className="text-xs font-semibold text-[#6F6265]">{label}</p>
                    <p className="mt-2 text-2xl font-extrabold text-[#7A2348]">—</p>
                    <p className="mt-1 text-[11px] text-[#6F6265]">Awaiting backend data</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </VendorLayout>
  );
}