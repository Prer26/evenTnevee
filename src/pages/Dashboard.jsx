import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PayVendorModal from "@/components/PayVendorModal";
import ReviewModal from "@/components/ReviewModal";
import AdminLayout from "@/components/AdminLayout";
import {
  Store,
  Wallet,
  Search,
  Bell,
  ArrowUpRight,
  Receipt,
  AlertCircle,
  CalendarDays,
  Plus,
  Users,
  Clock3,
  ChevronRight,
  ChevronLeft,
  User,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Instagram,
  Pencil,
  Check,
  Award,
  Crop,
  X,
} from "lucide-react";

const formatMoney = (amount) =>
  `₹ ${Number(amount || 0).toLocaleString("en-IN")}`;

const getDisplayName = (user) => {
  const name =
    user?.full_name ||
    user?.name ||
    user?.display_name ||
    user?.profile?.full_name ||
    user?.profile?.name;

  if (name) return String(name).trim();

  if (user?.email) {
    return user.email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  return "there";
};

const getInitials = (name) =>
  String(name || "E")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getEventDate = (date) => {
  if (!date) return "Date TBC";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date TBC";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const COUNTRY_CODES = [
  { code: "+91", label: "India" },
  { code: "+1", label: "USA / Canada" },
  { code: "+44", label: "UK" },
  { code: "+61", label: "Australia" },
  { code: "+65", label: "Singapore" },
  { code: "+971", label: "UAE" },
  { code: "+81", label: "Japan" },
  { code: "+49", label: "Germany" },
  { code: "+33", label: "France" },
  { code: "+39", label: "Italy" },
  { code: "+27", label: "South Africa" },
  { code: "+64", label: "New Zealand" },
];

const emptyCompanyProfile = (user, displayName) => ({
  full_name: displayName || "",
  company_name: "",
  industry: "",
  location: "",
  business_email: user?.email || "",
  business_phone_country_code: "+91",
  business_phone_number: "",
  about_company: "",
  company_type: "",
  website: "",
  founded_year: "",
  company_size: "",
  company_linkedin: "",
  instagram: "",
  services: [],
  logo_url: "",
  logo_crop: {},
  banner_url: "",
  banner_crop: {},
  founder_name: displayName || "",
  founder_title: "Founder & CEO",
  founder_email: user?.email || "",
  founder_phone_country_code: "+91",
  founder_phone_number: "",
  founder_linkedin: "",
  founder_bio: "",
  founder_photo_url: "",
  founder_photo_crop: {},
  team_members: [],
  profile_completion: 0,
  is_verified: false,
});

const normaliseCompanyProfile = (record, user, displayName) => {
  const base = emptyCompanyProfile(user, displayName);

  if (!record) return base;

  let legacy = {};
  if (record.profile_data) {
    try {
      legacy = JSON.parse(record.profile_data) || {};
    } catch {
      legacy = {};
    }
  }

  const merged = {
    ...base,
    ...record,
    ...legacy,
  };

  // Keep compatibility with the previous ProfileSection field names.
  // The person name always comes from the authenticated user created at login.
  merged.full_name = displayName || record.full_name || legacy.full_name || "";
  merged.company_name = record.company_name || legacy.companyName || "";
  merged.business_email = record.business_email || legacy.email || user?.email || "";
  merged.business_phone_number =
    record.business_phone_number ||
    (legacy.phone || "").replace(/^\+\d[\d\s-]*/, "").replace(/\D/g, "") ||
    "";
  merged.business_phone_country_code =
    record.business_phone_country_code ||
    (legacy.phone?.match(/^\+\d+/)?.[0] || "+91");
  merged.industry = record.industry || legacy.industry || "";
  merged.location = record.location || legacy.location || "";
  merged.website = record.website || legacy.website || "";
  merged.founded_year = record.founded_year || legacy.founded || "";
  merged.company_size = record.company_size || legacy.companySize || "";
  merged.company_type = record.company_type || legacy.companyType || "";
  merged.about_company = record.about_company || legacy.about || "";
  merged.logo_url = record.logo_url || legacy.logo || "";
  merged.banner_url = record.banner_url || legacy.banner || "";
  merged.company_linkedin = record.company_linkedin || legacy.companyLinkedin || "";
  merged.instagram = record.instagram || legacy.instagram || "";
  merged.services = Array.isArray(record.services)
    ? record.services
    : Array.isArray(legacy.services)
      ? legacy.services
      : [];
  // Founder / Co-founder name is always the authenticated login name.
  merged.founder_name = displayName || record.founder_name || legacy.founderName || "";
  merged.founder_title = record.founder_title || legacy.founderTitle || "Founder & CEO";
  merged.founder_email = record.founder_email || legacy.founderEmail || user?.email || "";
  merged.founder_phone_number =
    record.founder_phone_number ||
    (legacy.founderPhone || "").replace(/^\+\d[\d\s-]*/, "").replace(/\D/g, "") ||
    "";
  merged.founder_phone_country_code =
    record.founder_phone_country_code ||
    (legacy.founderPhone?.match(/^\+\d+/)?.[0] || "+91");
  merged.founder_linkedin = record.founder_linkedin || legacy.founderLinkedin || "";
  merged.founder_bio = record.founder_bio || legacy.founderBio || "";
  merged.founder_photo_url = record.founder_photo_url || legacy.founderPhoto || "";
  merged.team_members = Array.isArray(record.team_members)
    ? record.team_members
    : Array.isArray(legacy.employees)
      ? legacy.employees.map((employee) => ({
          full_name: employee.full_name || employee.name || "",
          designation: employee.designation || employee.role || "",
          department: employee.department || "",
          email: employee.email || "",
          phone_country_code: employee.phone_country_code || "+91",
          phone_number: employee.phone_number || "",
          linkedin: employee.linkedin || "",
          photo_url: employee.photo_url || employee.photo || "",
          photo_crop: employee.photo_crop || {},
        }))
      : [];

  return merged;
};

const calculateProfileCompletion = (profile) => {
  const required = [
    profile.full_name,
    profile.company_name,
    profile.industry,
    profile.location,
    profile.business_email,
    profile.business_phone_country_code,
    profile.business_phone_number,
    profile.about_company,
    profile.company_type,
  ];
  return Math.round((required.filter(Boolean).length / required.length) * 100);
};

const ProfileField = ({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
}) => (
  <div>
    <label className="mb-1.5 block text-[11px] font-semibold text-[#292525]/70">
      {label} {required && <span className="text-[#7A2348]">*</span>}
    </label>
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className="block h-11 w-full rounded-xl border border-[#292525]/12 bg-[#F3E7D3] px-3.5 text-sm text-[#292525] outline-none transition-all duration-150 placeholder:text-[#292525]/30 focus:border-[#7A2348] focus:ring-2 focus:ring-[#7A2348]/10"
    />
  </div>
);

const ProfileTextField = ({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 5,
  required = false,
}) => (
  <div>
    <label className="mb-1.5 block text-[11px] font-semibold text-[#292525]/70">
      {label} {required && <span className="text-[#7A2348]">*</span>}
    </label>
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="block w-full resize-y rounded-xl border border-[#292525]/12 bg-[#F3E7D3] px-3.5 py-3 text-sm leading-6 text-[#292525] outline-none transition-all duration-150 placeholder:text-[#292525]/30 focus:border-[#7A2348] focus:ring-2 focus:ring-[#7A2348]/10"
    />
  </div>
);

const CountryPhoneField = ({
  label,
  countryCode,
  number,
  onCountryChange,
  onNumberChange,
  required = false,
}) => (
  <div>
    <label className="mb-1.5 block text-[11px] font-semibold text-[#292525]/70">
      {label} {required && <span className="text-[#7A2348]">*</span>}
    </label>
    <div className="flex h-11 overflow-hidden rounded-xl border border-[#292525]/12 bg-[#F3E7D3] transition-all duration-150 focus-within:border-[#7A2348] focus-within:ring-2 focus-within:ring-[#7A2348]/10">
      <select
        value={countryCode || "+91"}
        onChange={(e) => onCountryChange(e.target.value)}
        className="w-[105px] shrink-0 border-r border-[#292525]/10 bg-transparent px-2.5 text-sm font-semibold text-[#292525] outline-none"
      >
        {COUNTRY_CODES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.code} · {country.label}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={number ?? ""}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s-]/g, ""))}
        placeholder="98765 43210"
        autoComplete="tel"
        className="min-w-0 flex-1 bg-transparent px-3.5 text-sm text-[#292525] outline-none placeholder:text-[#292525]/30"
      />
    </div>
  </div>
);

function CropEditor({ image, aspect = 1, onApply, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);

  const applyCrop = () => {
    const source = new Image();
    source.onload = () => {
      const outputWidth = aspect === 1 ? 900 : 1200;
      const outputHeight = Math.round(outputWidth / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");

      const sourceRatio = source.width / source.height;
      let cropWidth;
      let cropHeight;

      if (sourceRatio > aspect) {
        cropHeight = source.height / zoom;
        cropWidth = cropHeight * aspect;
      } else {
        cropWidth = source.width / zoom;
        cropHeight = cropWidth / aspect;
      }

      const maxX = Math.max(0, source.width - cropWidth);
      const maxY = Math.max(0, source.height - cropHeight);
      const sx = (maxX * positionX) / 100;
      const sy = (maxY * positionY) / 100;

      ctx.drawImage(
        source,
        sx,
        sy,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      onApply(canvas.toDataURL("image/jpeg", 0.86), {
        zoom,
        positionX,
        positionY,
        aspect,
      });
    };
    source.src = image;
  };

  const previewHeight = aspect === 1 ? "h-[330px] max-w-[330px]" : "h-[260px] w-full";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#292525]/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-[#7A2348]/20 bg-[#F3E7D3] p-5 shadow-2xl md:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7A2348]">
              Adjust image
            </p>
            <h3 className="mt-1 text-xl font-bold text-[#292525]">
              Crop & position
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#7A2348]/15 text-[#7A2348] transition hover:bg-[#EBD9BC]"
            aria-label="Close crop editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#7A2348]/15 bg-[#EBD9BC] p-3">
          <div
            className={`${previewHeight} relative mx-auto overflow-hidden rounded-xl bg-[#292525]/10`}
            style={{ aspectRatio: aspect }}
          >
            <img
              src={image}
              alt="Crop preview"
              className="absolute h-full w-full object-cover"
              style={{
                transform: `scale(${zoom})`,
                objectPosition: `${positionX}% ${positionY}%`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 border-2 border-white/80 shadow-[inset_0_0_0_999px_rgba(41,37,37,0.04)]" />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="text-xs font-semibold text-[#292525]/65">
            Zoom
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-2 w-full accent-[#7A2348]"
            />
          </label>
          <label className="text-xs font-semibold text-[#292525]/65">
            Horizontal
            <input
              type="range"
              min="0"
              max="100"
              value={positionX}
              onChange={(e) => setPositionX(Number(e.target.value))}
              className="mt-2 w-full accent-[#7A2348]"
            />
          </label>
          <label className="text-xs font-semibold text-[#292525]/65">
            Vertical
            <input
              type="range"
              min="0"
              max="100"
              value={positionY}
              onChange={(e) => setPositionY(Number(e.target.value))}
              className="mt-2 w-full accent-[#7A2348]"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#7A2348]/20 px-5 py-2.5 text-xs font-bold text-[#7A2348] transition hover:bg-[#EBD9BC]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyCrop}
            className="rounded-full bg-[#7A2348] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#5A1835] hover:shadow-md"
          >
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileImagePicker({
  label,
  value,
  onSelect,
  onCrop,
  onRemove,
  round = false,
  banner = false,
  required = false,
}) {
  const inputId = `profile-image-${label.toLowerCase().replace(/\W+/g, "-")}`;

  return (
    <div className={banner ? "w-full" : "flex items-center gap-4"}>
      <div
        className={`${banner ? "h-44 w-full rounded-[24px]" : `${round ? "rounded-full" : "rounded-2xl"} h-24 w-24`} shrink-0 overflow-hidden border border-[#7A2348]/15 bg-[#EBD9BC] shadow-sm transition-shadow duration-150 hover:shadow-md`}
      >
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#7A2348]/50">
            <Building2 className="h-7 w-7" />
            {banner && <span className="text-[10px] font-semibold">Banner</span>}
          </div>
        )}
      </div>

      <div className={banner ? "mt-3 flex flex-wrap items-center gap-2" : ""}>
        {!banner && (
          <div className="mb-2">
            <p className="text-sm font-semibold text-[#292525]">
              {label} {required && <span className="text-[#7A2348]">*</span>}
            </p>
            <p className="mt-0.5 text-xs text-[#292525]/45">
              JPG, PNG or WEBP
            </p>
          </div>
        )}

        <label
          htmlFor={inputId}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#7A2348]/20 bg-[#F3E7D3] px-3.5 py-2 text-xs font-bold text-[#7A2348] transition hover:bg-[#EBD9BC]"
        >
          <Plus className="h-3.5 w-3.5" />
          {value ? "Change image" : "Add image"}
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onSelect(e.target.files?.[0])}
          />
        </label>

        {value && (
          <>
            <button
              type="button"
              onClick={onCrop}
              className="inline-flex items-center gap-2 rounded-full border border-[#7A2348]/20 px-3.5 py-2 text-xs font-bold text-[#7A2348] transition hover:bg-[#EBD9BC]"
            >
              <Crop className="h-3.5 w-3.5" />
              Crop
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full px-3 py-2 text-xs font-bold text-[#7A2348] transition hover:bg-[#EBD9BC]"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileSection({ user, displayName }) {
  const initial = emptyCompanyProfile(user, displayName);
  const [profile, setProfile] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [profileRecordId, setProfileRecordId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cropState, setCropState] = useState(null);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user?.id && !user?.email) {
        setProfileLoading(false);
        return;
      }

      try {
        const records = await base44.entities.CompanyProfile.list(
          "-created_date",
          100
        );

        const record = (records || []).find(
          (item) =>
            (user?.id && item.user_id === user.id) ||
            (user?.email && item.email === user.email)
        );

        if (!active) return;

        const loaded = normaliseCompanyProfile(record, user, displayName);
        setProfileRecordId(record?.id || null);
        setProfile(loaded);
        setDraft(loaded);
      } catch (error) {
        console.error("Unable to load company profile:", error);
        setSavedMessage("Could not load saved profile");
        window.setTimeout(() => setSavedMessage(""), 2500);
      } finally {
        if (active) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, [user?.id, user?.email, displayName]);

  const updateDraft = (field, value) =>
    setDraft((current) => ({ ...current, [field]: value }));

  const requiredMissing = () => {
    const required = [
      ["full_name", "Full name"],
      ["company_name", "Company / Business name"],
      ["industry", "Industry"],
      ["location", "Location / Headquarters"],
      ["business_email", "Business email"],
      ["business_phone_number", "Business contact number"],
      ["about_company", "About the company"],
      ["company_type", "Company type"],
    ];

    return required.filter(([key]) => !String(draft[key] || "").trim());
  };

  const saveProfile = async () => {
    if (saving) return;

    const missing = requiredMissing();
    if (missing.length) {
      setValidationMessage(
        `Please complete: ${missing.map(([, label]) => label).join(", ")}`
      );
      return;
    }

    setValidationMessage("");
    setSaving(true);

    // Send only the fields defined in CompanyProfile. This prevents legacy/UI-only
    // fields from being rejected by the Base44 entity schema.
    const profileToSave = {
      user_id: user?.id || "",
      email: user?.email || draft.business_email || "",
      full_name: String(draft.full_name || "").trim(),
      company_name: String(draft.company_name || "").trim(),
      industry: String(draft.industry || "").trim(),
      location: String(draft.location || "").trim(),
      business_email: String(draft.business_email || user?.email || "").trim(),
      business_phone_country_code: draft.business_phone_country_code || "+91",
      business_phone_number: String(draft.business_phone_number || "").replace(/\D/g, ""),
      about_company: String(draft.about_company || "").trim(),
      company_type: String(draft.company_type || "").trim(),
      website: String(draft.website || "").trim(),
      founded_year: draft.founded_year ? Number(draft.founded_year) : undefined,
      company_size: String(draft.company_size || "").trim(),
      company_linkedin: String(draft.company_linkedin || "").trim(),
      instagram: String(draft.instagram || "").trim(),
      services: Array.isArray(draft.services) ? draft.services : [],
      logo_url: draft.logo_url || "",
      logo_crop: draft.logo_crop || {},
      banner_url: draft.banner_url || "",
      banner_crop: draft.banner_crop || {},
      // Never create a second person-name source in the company profile.
      founder_name: String(displayName || draft.full_name || "").trim(),
      founder_title: String(draft.founder_title || "Founder & CEO").trim(),
      founder_email: String(draft.founder_email || "").trim(),
      founder_phone_country_code: draft.founder_phone_country_code || "+91",
      founder_phone_number: String(draft.founder_phone_number || "").replace(/\D/g, ""),
      founder_linkedin: String(draft.founder_linkedin || "").trim(),
      founder_bio: String(draft.founder_bio || "").trim(),
      founder_photo_url: draft.founder_photo_url || "",
      founder_photo_crop: draft.founder_photo_crop || {},
      team_members: Array.isArray(draft.team_members) ? draft.team_members : [],
      profile_completion: calculateProfileCompletion(draft),
      is_verified: Boolean(draft.is_verified),
    };

    // Do not send undefined optional values.
    Object.keys(profileToSave).forEach((key) => {
      if (profileToSave[key] === undefined) delete profileToSave[key];
    });

    try {
      let saved;

      if (profileRecordId) {
        saved = await base44.entities.CompanyProfile.update(
          profileRecordId,
          profileToSave
        );
      } else {
        const existingRecords = await base44.entities.CompanyProfile.list(
          "-created_date",
          100
        );
        const existing = (existingRecords || []).find(
          (item) =>
            (user?.id && item.user_id === user.id) ||
            (user?.email && item.email === user.email)
        );

        if (existing?.id) {
          saved = await base44.entities.CompanyProfile.update(
            existing.id,
            profileToSave
          );
          setProfileRecordId(existing.id);
        } else {
          saved = await base44.entities.CompanyProfile.create(profileToSave);
          setProfileRecordId(saved?.id || null);
        }
      }

      const finalProfile = normaliseCompanyProfile(
        saved || profileToSave,
        user,
        displayName
      );

      setProfile(finalProfile);
      setDraft(finalProfile);
      setEditing(false);
      setSavedMessage("Company profile saved successfully");
      window.setTimeout(() => setSavedMessage(""), 3000);
    } catch (error) {
      console.error("Unable to save company profile:", error);
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Base44 rejected the CompanyProfile data.";
      setSavedMessage(`Unable to save profile: ${message}`);
      window.setTimeout(() => setSavedMessage(""), 7000);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setDraft({ ...profile });
    setValidationMessage("");
    setEditing(false);
  };

  const readImage = (file, callback) => {
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const openImage = (field, file, aspect, employeeIndex = null) => {
    readImage(file, (source) => {
      setCropState({
        source,
        field,
        aspect,
        employeeIndex,
      });
    });
  };

  const applyCrop = (dataUrl, crop) => {
    if (!cropState) return;

    if (cropState.employeeIndex !== null) {
      const next = [...draft.team_members];
      next[cropState.employeeIndex] = {
        ...next[cropState.employeeIndex],
        photo_url: dataUrl,
        photo_crop: crop,
      };
      updateDraft("team_members", next);
    } else {
      updateDraft(cropState.field, dataUrl);
      updateDraft(
        cropState.field === "logo_url"
          ? "logo_crop"
          : cropState.field === "banner_url"
            ? "banner_crop"
            : "founder_photo_crop",
        crop
      );
    }

    setCropState(null);
  };

  const addEmployee = () =>
    updateDraft("team_members", [
      ...(draft.team_members || []),
      {
        full_name: "",
        designation: "",
        department: "",
        email: "",
        phone_country_code: "+91",
        phone_number: "",
        linkedin: "",
        photo_url: "",
        photo_crop: {},
      },
    ]);

  const updateEmployee = (index, field, value) => {
    const next = [...(draft.team_members || [])];
    next[index] = { ...next[index], [field]: value };
    updateDraft("team_members", next);
  };

  const removeEmployee = (index) =>
    updateDraft(
      "team_members",
      (draft.team_members || []).filter((_, itemIndex) => itemIndex !== index)
    );

  const completion = calculateProfileCompletion(draft);

  const companyInitials = getInitials(profile.company_name || "Company");

  if (profileLoading) {
    return (
      <div className="min-h-full bg-[#F3E7D3] pb-14 text-[#292525]">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[34px] border border-[#7A2348]/12 bg-[#EBD9BC] p-8">
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#7A2348]">
              Organization
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Loading company profile…
            </h1>
            <p className="mt-2 text-sm text-[#292525]/55">
              Fetching your saved business information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F3E7D3] pb-14 text-[#292525]">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A2348]/70 transition hover:text-[#7A2348]"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#7A2348]">
              Organization
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Company Profile
            </h1>
            <p className="mt-1 text-sm text-[#292525]/55">
              Your professional identity on evenTneve.
            </p>
          </div>

          {!editing ? (
            <button
              type="button"
              onClick={() => {
                setDraft({
                  ...profile,
                  full_name: displayName || profile.full_name || "",
                  founder_name: displayName || profile.founder_name || "",
                });
                setEditing(true);
              }}
              className="inline-flex items-center gap-2 self-start rounded-full bg-[#7A2348] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#5A1835] hover:shadow-md"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full border border-[#7A2348]/20 px-4 py-2.5 text-xs font-bold text-[#7A2348] transition hover:bg-[#EBD9BC]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={saveProfile}
                className="inline-flex items-center gap-2 rounded-full bg-[#7A2348] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#5A1835] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-5">
            <section className="rounded-[30px] border border-[#7A2348]/12 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.05)] md:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7A2348]">
                    01 · Identity
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    Company identity
                  </h2>
                  <p className="mt-1 text-sm text-[#292525]/50">
                    Required fields are marked with *
                  </p>
                </div>

                <div className="rounded-full border border-[#7A2348]/15 px-3 py-1.5 text-xs font-bold text-[#7A2348]">
                  Profile {completion}% complete
                </div>
              </div>

              <div className="space-y-6">
                <ProfileImagePicker
                  label="Company logo"
                  value={draft.logo_url}
                  onSelect={(file) => openImage("logo_url", file, 1)}
                  onCrop={() =>
                    draft.logo_url &&
                    setCropState({
                      source: draft.logo_url,
                      field: "logo_url",
                      aspect: 1,
                      employeeIndex: null,
                    })
                  }
                  onRemove={() => updateDraft("logo_url", "")}
                />

                <ProfileImagePicker
                  label="Profile banner / cover"
                  value={draft.banner_url}
                  banner
                  onSelect={(file) => openImage("banner_url", file, 3)}
                  onCrop={() =>
                    draft.banner_url &&
                    setCropState({
                      source: draft.banner_url,
                      field: "banner_url",
                      aspect: 3,
                      employeeIndex: null,
                    })
                  }
                  onRemove={() => updateDraft("banner_url", "")}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold text-[#292525]/70">
                      Full name <span className="text-[#7A2348]">*</span>
                    </label>
                    <div className="flex h-11 items-center rounded-xl border border-[#292525]/12 bg-[#EBD9BC]/45 px-3.5 text-sm font-semibold text-[#292525]">
                      {displayName || "Name from login"}
                    </div>
                    <p className="mt-1.5 text-[10px] text-[#292525]/45">
                      This name comes from your login account and is used throughout your profile.
                    </p>
                  </div>
                  <ProfileField
                    label="Company / Business name"
                    required
                    value={draft.company_name}
                    onChange={(v) => updateDraft("company_name", v)}
                    placeholder="Your business name"
                  />
                  <ProfileField
                    label="Industry"
                    required
                    value={draft.industry}
                    onChange={(v) => updateDraft("industry", v)}
                    placeholder="Event Management"
                  />
                  <ProfileField
                    label="Location / Headquarters"
                    required
                    value={draft.location}
                    onChange={(v) => updateDraft("location", v)}
                    placeholder="Bengaluru, Karnataka"
                  />
                  <ProfileField
                    label="Company type"
                    required
                    value={draft.company_type}
                    onChange={(v) => updateDraft("company_type", v)}
                    placeholder="Private Company / Startup / LLP"
                  />
                  <ProfileField
                    label="Founded year"
                    value={draft.founded_year}
                    onChange={(v) => updateDraft("founded_year", v)}
                    placeholder="2026"
                    type="number"
                  />
                  <ProfileField
                    label="Company size"
                    value={draft.company_size}
                    onChange={(v) => updateDraft("company_size", v)}
                    placeholder="1–10 employees"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7A2348]/12 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.05)] md:p-8">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7A2348]">
                  02 · Contact
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  Business contact details
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField
                  label="Business email"
                  required
                  value={draft.business_email}
                  onChange={(v) => updateDraft("business_email", v)}
                  placeholder="contact@yourcompany.com"
                  type="email"
                />
                <CountryPhoneField
                  label="Business contact number"
                  required
                  countryCode={draft.business_phone_country_code}
                  number={draft.business_phone_number}
                  onCountryChange={(v) =>
                    updateDraft("business_phone_country_code", v)
                  }
                  onNumberChange={(v) =>
                    updateDraft("business_phone_number", v)
                  }
                />
                <ProfileField
                  label="Website"
                  value={draft.website}
                  onChange={(v) => updateDraft("website", v)}
                  placeholder="https://yourcompany.com"
                  type="url"
                />
                <ProfileField
                  label="Company LinkedIn"
                  value={draft.company_linkedin}
                  onChange={(v) => updateDraft("company_linkedin", v)}
                  placeholder="https://linkedin.com/company/..."
                  type="url"
                />
                <ProfileField
                  label="Instagram"
                  value={draft.instagram}
                  onChange={(v) => updateDraft("instagram", v)}
                  placeholder="https://instagram.com/..."
                  type="url"
                />
              </div>

              <div className="mt-4">
                <ProfileTextField
                  label="About the company"
                  required
                  value={draft.about_company}
                  onChange={(v) => updateDraft("about_company", v)}
                  placeholder="Tell customers, vendors and event planners what your company does..."
                />
              </div>

              <div className="mt-5 rounded-2xl border border-[#7A2348]/12 bg-[#EBD9BC]/45 p-4">
                <p className="text-xs font-bold text-[#7A2348]">
                  Services & specialties
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(draft.services || []).map((service, index) => (
                    <span
                      key={`${service}-${index}`}
                      className="inline-flex items-center gap-2 rounded-full border border-[#7A2348]/15 bg-[#F3E7D3] px-3 py-1.5 text-xs font-semibold text-[#7A2348]"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft(
                            "services",
                            draft.services.filter((_, i) => i !== index)
                          )
                        }
                        className="font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    id="service-input"
                    placeholder="e.g. Wedding Planning"
                    className="h-10 flex-1 rounded-xl border border-[#292525]/12 bg-[#F3E7D3] px-3 text-sm outline-none focus:border-[#7A2348]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const value = e.currentTarget.value.trim();
                        if (value && !draft.services.includes(value)) {
                          updateDraft("services", [...draft.services, value]);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("service-input");
                      const value = input?.value.trim();
                      if (value && !draft.services.includes(value)) {
                        updateDraft("services", [...draft.services, value]);
                        input.value = "";
                      }
                    }}
                    className="rounded-xl bg-[#7A2348] px-4 text-xs font-bold text-white transition hover:bg-[#5A1835]"
                  >
                    Add
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7A2348]/12 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.05)] md:p-8">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7A2348]">
                  03 · Leadership
                </p>
                <h2 className="mt-1 text-xl font-bold">Founder / CEO</h2>
              </div>

              <div className="mb-7">
                <ProfileImagePicker
                  label="Founder / CEO photo"
                  value={draft.founder_photo_url}
                  round
                  onSelect={(file) =>
                    openImage("founder_photo_url", file, 1)
                  }
                  onCrop={() =>
                    draft.founder_photo_url &&
                    setCropState({
                      source: draft.founder_photo_url,
                      field: "founder_photo_url",
                      aspect: 1,
                      employeeIndex: null,
                    })
                  }
                  onRemove={() => updateDraft("founder_photo_url", "")}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold text-[#292525]/70">
                    Founder / Co-founder name
                  </label>
                  <div className="flex h-11 items-center rounded-xl border border-[#292525]/12 bg-[#EBD9BC]/45 px-3.5 text-sm font-semibold text-[#292525]">
                    {displayName || "Name from login"}
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#292525]/45">
                    Automatically fetched from your login account.
                  </p>
                </div>
                <ProfileField
                  label="Designation"
                  value={draft.founder_title}
                  onChange={(v) => updateDraft("founder_title", v)}
                  placeholder="Founder & CEO"
                />
                <ProfileField
                  label="Email"
                  value={draft.founder_email}
                  onChange={(v) => updateDraft("founder_email", v)}
                  placeholder="name@company.com"
                  type="email"
                />
                <CountryPhoneField
                  label="Contact number"
                  countryCode={draft.founder_phone_country_code}
                  number={draft.founder_phone_number}
                  onCountryChange={(v) =>
                    updateDraft("founder_phone_country_code", v)
                  }
                  onNumberChange={(v) =>
                    updateDraft("founder_phone_number", v)
                  }
                />
                <ProfileField
                  label="LinkedIn"
                  value={draft.founder_linkedin}
                  onChange={(v) => updateDraft("founder_linkedin", v)}
                  placeholder="https://linkedin.com/in/..."
                  type="url"
                />
              </div>

              <div className="mt-4">
                <ProfileTextField
                  label="Professional bio"
                  value={draft.founder_bio}
                  onChange={(v) => updateDraft("founder_bio", v)}
                  placeholder="A short professional introduction..."
                  rows={4}
                />
              </div>
            </section>

            <section className="rounded-[30px] border border-[#7A2348]/12 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.05)] md:p-8">
              <div className="mb-6 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7A2348]">
                    04 · Team
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    Employees & team
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addEmployee}
                  className="inline-flex items-center gap-2 rounded-full border border-[#7A2348]/20 px-4 py-2.5 text-xs font-bold text-[#7A2348] transition hover:bg-[#EBD9BC]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add employee
                </button>
              </div>

              {(draft.team_members || []).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#7A2348]/20 p-8 text-center text-sm text-[#292525]/45">
                  No employees added yet. Add your team members here.
                </div>
              ) : (
                <div className="space-y-4">
                  {draft.team_members.map((employee, index) => (
                    <div
                      key={`${employee.full_name || "member"}-${index}`}
                      className="rounded-2xl border border-[#292525]/10 bg-[#EBD9BC]/30 p-5 transition-shadow duration-150 hover:shadow-sm"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-bold">
                          Team member {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeEmployee(index)}
                          className="text-xs font-bold text-[#7A2348] hover:underline"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mb-5">
                        <ProfileImagePicker
                          label="Employee photo"
                          value={employee.photo_url}
                          round
                          onSelect={(file) =>
                            openImage(
                              "employee_photo",
                              file,
                              1,
                              index
                            )
                          }
                          onCrop={() =>
                            employee.photo_url &&
                            setCropState({
                              source: employee.photo_url,
                              field: "employee_photo",
                              aspect: 1,
                              employeeIndex: index,
                            })
                          }
                          onRemove={() =>
                            updateEmployee(index, "photo_url", "")
                          }
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <ProfileField
                          label="Full name"
                          value={employee.full_name}
                          onChange={(v) =>
                            updateEmployee(index, "full_name", v)
                          }
                          placeholder="Full name"
                        />
                        <ProfileField
                          label="Designation"
                          value={employee.designation}
                          onChange={(v) =>
                            updateEmployee(index, "designation", v)
                          }
                          placeholder="Designation"
                        />
                        <ProfileField
                          label="Department"
                          value={employee.department}
                          onChange={(v) =>
                            updateEmployee(index, "department", v)
                          }
                          placeholder="Department"
                        />
                        <ProfileField
                          label="Email"
                          value={employee.email}
                          onChange={(v) =>
                            updateEmployee(index, "email", v)
                          }
                          placeholder="email@company.com"
                          type="email"
                        />
                        <CountryPhoneField
                          label="Contact number"
                          countryCode={employee.phone_country_code}
                          number={employee.phone_number}
                          onCountryChange={(v) =>
                            updateEmployee(index, "phone_country_code", v)
                          }
                          onNumberChange={(v) =>
                            updateEmployee(index, "phone_number", v)
                          }
                        />
                        <ProfileField
                          label="LinkedIn"
                          value={employee.linkedin}
                          onChange={(v) =>
                            updateEmployee(index, "linkedin", v)
                          }
                          placeholder="https://linkedin.com/in/..."
                          type="url"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {validationMessage && (
              <div className="rounded-2xl border border-[#7A2348]/25 bg-[#7A2348]/8 px-5 py-4 text-sm font-semibold text-[#7A2348]">
                {validationMessage}
              </div>
            )}

            <div className="flex justify-end border-t border-[#7A2348]/10 pt-5">
              <button
                type="button"
                disabled={saving}
                onClick={saveProfile}
                className="rounded-full bg-[#7A2348] px-6 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#5A1835] hover:shadow-md disabled:opacity-60"
              >
                {saving ? "Saving company profile…" : "Save Company Profile"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <section className="group relative overflow-hidden rounded-[28px] border border-[#7A2348]/12 bg-[#EBD9BC] shadow-[0_14px_36px_rgba(90,24,53,0.08)] transition-shadow duration-200 hover:shadow-[0_18px_44px_rgba(90,24,53,0.12)]">
              {profile.banner_url ? (
                <div className="relative h-44 w-full overflow-hidden sm:h-48 md:h-52">
                  <img
                    src={profile.banner_url}
                    alt="Company banner"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{
                      objectPosition: `${profile.banner_crop?.positionX ?? 50}% ${profile.banner_crop?.positionY ?? 50}%`,
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#292525]/15 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="h-28 w-full bg-[#EBD9BC]" />
              )}

              <button
                type="button"
                onClick={() => {
                  setDraft({
                    ...profile,
                    full_name: displayName || profile.full_name || "",
                    founder_name: displayName || profile.founder_name || "",
                  });
                  setEditing(true);
                }}
                className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#292525]/45 px-3.5 py-2 text-[11px] font-bold text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 hover:bg-[#292525]/65"
              >
                <Pencil className="h-3 w-3" />
                Edit profile
              </button>

              <div className="relative min-h-[118px] px-5 py-5 pl-[132px] sm:min-h-[124px] sm:pl-[150px] md:px-8 md:pl-[164px]">
                <div className="absolute bottom-5 left-5 h-24 w-24 overflow-hidden rounded-[20px] border-4 border-[#EBD9BC] bg-[#F3E7D3] shadow-md transition-transform duration-200 group-hover:scale-[1.02] sm:h-28 sm:w-28 md:left-8">
                  {profile.logo_url ? (
                    <img
                      src={profile.logo_url}
                      alt={profile.company_name || "Company logo"}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: `${profile.logo_crop?.positionX ?? 50}% ${profile.logo_crop?.positionY ?? 50}%`,
                      }}
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#7A2348]">
                      {companyInitials}
                    </span>
                  )}
                </div>

                <div className="flex min-h-[78px] flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-[28px] font-extrabold leading-tight tracking-[-0.025em] text-[#292525] sm:text-[32px]">
                      {profile.company_name || "Your Company Name"}
                    </h2>

                    {profile.is_verified && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#7A2348] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                        <Award className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-medium text-[#292525]/60">
                    {profile.industry && <span>{profile.industry}</span>}

                    {profile.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#7A2348]" />
                        {profile.location}
                      </span>
                    )}

                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#7A2348] transition hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Website
                      </a>
                    )}

                    {profile.company_linkedin && (
                      <a
                        href={profile.company_linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#7A2348] transition hover:underline"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                    )}

                    {profile.instagram && (
                      <a
                        href={profile.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#7A2348] transition hover:underline"
                      >
                        <Instagram className="h-3.5 w-3.5" />
                        Instagram
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[1.45fr_.8fr]">
              <section className="rounded-[30px] border border-[#7A2348]/10 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.05)] md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7A2348]">
                  About
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  About the company
                </h3>
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#292525]/65">
                  {profile.about_company ||
                    "Add your company story, services and what makes your business unique."}
                </p>

                {profile.services?.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {profile.services.map((service, index) => (
                      <span
                        key={`${service}-${index}`}
                        className="rounded-full border border-[#7A2348]/15 px-3 py-1.5 text-xs font-semibold text-[#7A2348] transition hover:bg-[#EBD9BC]/50"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[30px] border border-[#7A2348]/10 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.05)] md:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7A2348]">
                  Company details
                </p>
                <div className="mt-5 space-y-4">
                  {profile.business_email && (
                    <div className="flex gap-3">
                      <div className="rounded-lg bg-[#EBD9BC] p-2 text-[#7A2348]">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#292525]/45">
                          Business email
                        </p>
                        <a
                          href={`mailto:${profile.business_email}`}
                          className="mt-0.5 block text-sm font-medium text-[#7A2348] transition hover:underline"
                        >
                          {profile.business_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {profile.business_phone_number && (
                    <div className="flex gap-3">
                      <div className="rounded-lg bg-[#EBD9BC] p-2 text-[#7A2348]">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#292525]/45">
                          Contact
                        </p>
                        <p className="mt-0.5 text-sm font-medium">
                          {profile.business_phone_country_code}{" "}
                          {profile.business_phone_number}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.location && (
                    <div className="flex gap-3">
                      <div className="rounded-lg bg-[#EBD9BC] p-2 text-[#7A2348]">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#292525]/45">
                          Headquarters
                        </p>
                        <p className="mt-0.5 text-sm font-medium">
                          {profile.location}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.company_linkedin && (
                    <a
                      href={profile.company_linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="flex gap-3 transition hover:opacity-80"
                    >
                      <div className="rounded-lg bg-[#EBD9BC] p-2 text-[#7A2348]">
                        <Linkedin className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#292525]/45">
                          LinkedIn
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-[#7A2348]">
                          Company profile
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-[30px] border border-[#7A2348]/10 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.05)] md:p-8">
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7A2348]">
                  Leadership
                </p>
                <h3 className="mt-1 text-2xl font-bold">
                  Founder / CEO
                </h3>
              </div>

              <div className="flex flex-col gap-5 md:flex-row md:items-center">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#7A2348]/10 bg-[#EBD9BC] shadow-sm">
                  {profile.founder_photo_url ? (
                    <img
                      src={profile.founder_photo_url}
                      alt={profile.founder_name || "Founder"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User className="h-8 w-8 text-[#7A2348]/45" />
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xl font-bold">
                    {profile.founder_name || "Founder name"}
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-[#7A2348]">
                    {profile.founder_title || "Founder & CEO"}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#292525]/60">
                    {profile.founder_bio ||
                      "Add a short professional bio from Edit Profile."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#292525]/60">
                    {profile.founder_email && (
                      <span>{profile.founder_email}</span>
                    )}
                    {profile.founder_phone_number && (
                      <span>
                        {profile.founder_phone_country_code}{" "}
                        {profile.founder_phone_number}
                      </span>
                    )}
                    {profile.founder_linkedin && (
                      <a
                        href={profile.founder_linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#7A2348] transition hover:underline"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {profile.team_members?.length > 0 && (
              <section className="rounded-[30px] border border-[#7A2348]/10 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.05)] md:p-8">
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7A2348]">
                    Team
                  </p>
                  <h3 className="mt-1 text-2xl font-bold">Our people</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.team_members.map((employee, index) => (
                    <div
                      key={`${employee.full_name || "member"}-${index}`}
                      className="rounded-2xl border border-[#292525]/10 bg-[#EBD9BC]/25 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7A2348]/25 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 overflow-hidden rounded-full bg-[#EBD9BC]">
                          {employee.photo_url ? (
                            <img
                              src={employee.photo_url}
                              alt={employee.full_name || ""}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <User className="h-5 w-5 text-[#7A2348]/45" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {employee.full_name || "Team member"}
                          </p>
                          <p className="text-xs text-[#7A2348]">
                            {employee.designation || "Team member"}
                          </p>
                          <p className="text-xs text-[#292525]/45">
                            {employee.department}
                          </p>
                        </div>
                      </div>
                      {employee.linkedin && (
                        <a
                          href={employee.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#7A2348] transition hover:underline"
                        >
                          <Linkedin className="h-3 w-3" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {cropState && (
          <CropEditor
            image={cropState.source}
            aspect={cropState.aspect}
            onApply={applyCrop}
            onClose={() => setCropState(null)}
          />
        )}

        {savedMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-full bg-[#7A2348] px-5 py-3 text-xs font-bold text-white shadow-lg">
            ✓ {savedMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    vendorCount: 0,
    txnCount: 0,
    pendingCount: 0,
    totalAmount: 0,
    topVendors: [],
    bookings: [],
    recentTransactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [payingBooking, setPayingBooking] = useState(null);
  const [reviewingBooking, setReviewingBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const displayName = getDisplayName(user); // Login account name; profile never overrides this.
  const initials = getInitials(displayName);
  const location = useLocation();

  const refreshBookings = () => {
    base44.entities.Booking.list("-event_date", 5)
      .catch(() => [])
      .then((bookings) => {
        setStats((current) => ({ ...current, bookings: bookings || [] }));
      });
  };

  const refreshDashboard = () => {
    setLoading(true);

    Promise.all([
      base44.entities.Vendor.list("-rating", 4).catch(() => []),
      base44.entities.Transaction.list("-created_date", 50).catch(() => []),
      base44.entities.Booking.list("-event_date", 5).catch(() => []),
    ])
      .then(([vendors, txns, bookings]) => {
        const safeVendors = vendors || [];
        const safeTxns = txns || [];
        const safeBookings = bookings || [];

        const pending = safeTxns.filter(
          (transaction) =>
            transaction.status === "Pending" ||
            transaction.status === "Overdue"
        );

        const total = safeTxns.reduce(
          (sum, transaction) => sum + Number(transaction.amount || 0),
          0
        );

        setStats({
          vendorCount: safeVendors.length,
          txnCount: safeTxns.length,
          pendingCount: pending.length,
          totalAmount: total,
          topVendors: safeVendors,
          bookings: safeBookings,
          recentTransactions: safeTxns.slice(0, 5),
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return stats.recentTransactions;

    return stats.recentTransactions.filter((transaction) =>
      [
        transaction.vendor,
        transaction.event_name,
        transaction.description,
        transaction.category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [searchQuery, stats.recentTransactions]);

  const upcomingBookings = stats.bookings
    .filter((booking) => {
      if (!booking.event_date) return true;
      const date = new Date(booking.event_date);
      return Number.isNaN(date.getTime()) || date >= new Date();
    })
    .slice(0, 4);

  // Keep every Dashboard hook above this point. The profile view is rendered
  // only after all hooks have run, so React never sees a different hook count.
  if (location.hash === "#profile") {
    return (
      <AdminLayout>
        <ProfileSection user={user} displayName={displayName} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-full bg-[#F3E7D3] text-[#292525]">

        {/* Top bar */}
        <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A2348]/60" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search vendors, events or transactions..."
              className="h-11 w-full rounded-full border border-[#7A2348]/20 bg-[#F3E7D3] pl-11 pr-4 text-[13px] text-[#292525] outline-none transition-all duration-150 focus:border-[#7A2348] focus:ring-2 focus:ring-[#7A2348]/10"
            />
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <button
              type="button"
              className="relative grid h-11 w-11 place-items-center rounded-full border border-[#7A2348]/20 bg-[#F3E7D3] text-[#7A2348] transition hover:border-[#7A2348] hover:bg-[#EBD9BC]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>

            <Link
              to="/dashboard#profile"
              className="flex items-center gap-3 rounded-full border border-[#7A2348]/20 bg-[#F3E7D3] px-2.5 py-1.5 shadow-sm transition-all duration-150 hover:border-[#7A2348] hover:bg-[#EBD9BC] hover:shadow-md"
              title="View company profile"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#7A2348] text-[11px] font-bold text-white">
                {initials}
              </span>

              <div className="hidden pr-2 sm:block">
                <p className="max-w-[150px] truncate text-[12.5px] font-semibold text-[#292525]">
                  {displayName}
                </p>
                <p className="text-[10.5px] text-[#7A2348]/65">
                  Event Planner
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Welcome hero */}
        <section className="relative overflow-hidden rounded-[30px] border border-[#7A2348]/20 bg-[#F3E7D3] p-6 shadow-[0_16px_40px_rgba(90,24,53,0.08)] sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#7A2348]/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-[#7A2348]/5 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7A2348]">
                Event planner workspace
              </p>

              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#7A2348] sm:text-4xl">
                Good evening, {displayName}
              </h1>

              <p className="mt-3 max-w-xl text-[14px] leading-7 text-[#7A2348]/70">
                Keep your events moving, stay on top of vendor activity, and
                manage your finances from one place.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 rounded-full bg-[#7A2348] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(122,35,72,0.18)] transition hover:bg-[#5A1835] hover:shadow-[0_10px_24px_rgba(122,35,72,0.24)]"
                >
                  <Plus className="h-4 w-4" />
                  Find vendors
                </Link>

                <Link
                  to="/financial-tracker"
                  className="inline-flex items-center gap-2 rounded-full border border-[#7A2348] bg-[#F3E7D3] px-5 py-2.5 text-[13px] font-semibold text-[#7A2348] transition hover:bg-[#7A2348] hover:text-white"
                >
                  <Wallet className="h-4 w-4" />
                  View finances
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:min-w-[390px]">
              <div className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-4 transition-shadow duration-150 hover:shadow-sm">
                <Users className="h-4 w-4 text-[#7A2348]" />
                <p className="mt-4 text-2xl font-bold text-[#7A2348]">
                  {loading ? "—" : stats.vendorCount}
                </p>
                <p className="mt-1 text-[11px] text-[#7A2348]/60">
                  Vendors connected
                </p>
              </div>

              <div className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-4 transition-shadow duration-150 hover:shadow-sm">
                <CalendarDays className="h-4 w-4 text-[#7A2348]" />
                <p className="mt-4 text-2xl font-bold text-[#7A2348]">
                  {loading ? "—" : upcomingBookings.length}
                </p>
                <p className="mt-1 text-[11px] text-[#7A2348]/60">
                  Upcoming bookings
                </p>
              </div>

              <div className="rounded-2xl border border-[#7A2348]/15 bg-[#F3E7D3] p-4 col-span-2 transition-shadow duration-150 hover:shadow-sm sm:col-span-1">
                <Clock3 className="h-4 w-4 text-[#7A2348]" />
                <p className="mt-4 text-2xl font-bold text-[#7A2348]">
                  {loading ? "—" : stats.pendingCount}
                </p>
                <p className="mt-1 text-[11px] text-[#7A2348]/60">
                  Payments needing attention
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* KPI row */}
        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Vendors",
              value: stats.vendorCount,
              detail: "available in marketplace",
              Icon: Store,
            },
            {
              label: "Transactions",
              value: stats.txnCount,
              detail: "saved financial records",
              Icon: Receipt,
            },
            {
              label: "Pending",
              value: stats.pendingCount,
              detail: "awaiting clearance",
              Icon: AlertCircle,
            },
            {
              label: "Total Volume",
              value: formatMoney(stats.totalAmount),
              detail: "from saved transactions",
              Icon: Wallet,
            },
          ].map(({ label, value, detail, Icon }) => (
            <div
              key={label}
              className="rounded-[24px] border border-[#7A2348]/18 bg-[#F3E7D3] p-5 shadow-[0_10px_28px_rgba(90,24,53,0.06)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(90,24,53,0.1)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A2348]/60">
                  {label}
                </p>

                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#7A2348]/8 text-[#7A2348]">
                  <Icon className="h-4 w-4" />
                </span>
              </div>

              <p className="mt-4 truncate font-display text-2xl font-bold text-[#7A2348]">
                {loading ? "—" : value}
              </p>

              <p className="mt-1 text-[11.5px] text-[#7A2348]/60">
                {detail}
              </p>
            </div>
          ))}
        </section>

        {/* Main workspace */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">

          {/* Event pipeline */}
          <div className="rounded-[28px] border border-[#7A2348]/18 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.06)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A2348]/60">
                  Your event pipeline
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-[#7A2348]">
                  Upcoming events
                </h2>
              </div>

              <Link
                to="/dashboard#events"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#7A2348] transition hover:underline"
              >
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {upcomingBookings.length ? (
                upcomingBookings.map((booking) => {
                  const status = booking.status || "Pending";

                  return (
                    <div
                      key={booking.id || `${booking.event_type}-${booking.event_date}`}
                      className="flex flex-col gap-4 rounded-2xl border border-[#7A2348]/12 bg-[#F3E7D3] p-4 transition-shadow duration-150 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#7A2348]/8 text-[#7A2348]">
                          <CalendarDays className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-semibold text-[#292525]">
                            {booking.event_type || "Event"}
                            {booking.vendor_name
                              ? ` — ${booking.vendor_name}`
                              : ""}
                          </p>

                          <p className="mt-1 text-[11.5px] text-[#7A2348]/60">
                            {getEventDate(booking.event_date)}
                            {booking.city ? ` · ${booking.city}` : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-[#7A2348]/20 bg-[#F3E7D3] px-3 py-1 text-[10.5px] font-semibold text-[#7A2348]">
                          {status}
                        </span>

                        {status === "Completed" ? (
                          <button
                            type="button"
                            onClick={() => setReviewingBooking(booking)}
                            className="rounded-full bg-[#7A2348] px-3 py-1.5 text-[10.5px] font-semibold text-white transition hover:bg-[#5A1835]"
                          >
                            Review
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPayingBooking(booking)}
                            className="rounded-full border border-[#7A2348] px-3 py-1.5 text-[10.5px] font-semibold text-[#7A2348] transition hover:bg-[#7A2348] hover:text-white"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-[#7A2348]/25 px-5 py-10 text-center">
                  <CalendarDays className="mx-auto h-7 w-7 text-[#7A2348]/50" />
                  <p className="mt-3 text-sm font-semibold text-[#7A2348]">
                    No upcoming events yet
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-[12px] leading-5 text-[#7A2348]/60">
                    Your booked events will appear here automatically.
                  </p>
                  <Link
                    to="/marketplace"
                    className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#7A2348]"
                  >
                    Explore vendors
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Financial snapshot */}
          <div className="rounded-[28px] border border-[#7A2348]/18 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.06)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A2348]/60">
              Financial snapshot
            </p>

            <h2 className="mt-1 font-display text-xl font-bold text-[#7A2348]">
              Keep every payment visible
            </h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-[#7A2348]/12 p-4 transition-shadow duration-150 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#7A2348]/60">
                    Total transaction volume
                  </span>
                  <Wallet className="h-4 w-4 text-[#7A2348]" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-[#7A2348]">
                  {loading ? "—" : formatMoney(stats.totalAmount)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#7A2348]/12 p-4 transition-shadow duration-150 hover:shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#7A2348]/60">
                    Payments needing attention
                  </span>
                  <AlertCircle className="h-4 w-4 text-[#7A2348]" />
                </div>
                <p className="mt-2 font-display text-2xl font-bold text-[#7A2348]">
                  {loading ? "—" : stats.pendingCount}
                </p>
              </div>
            </div>

            <Link
              to="/financial-tracker"
              className="mt-4 flex items-center justify-between rounded-2xl bg-[#7A2348] px-4 py-3 text-[12px] font-semibold text-white transition hover:bg-[#5A1835]"
            >
              Open Financial Tracker
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Recent activity + vendors */}
        <section className="mt-5 grid gap-5 lg:grid-cols-2">

          {/* Recent transactions */}
          <div className="rounded-[28px] border border-[#7A2348]/18 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A2348]/60">
                  Recent activity
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-[#7A2348]">
                  Latest transactions
                </h2>
              </div>

              <Link
                to="/financial-tracker"
                className="text-[12px] font-semibold text-[#7A2348] transition hover:underline"
              >
                View tracker
              </Link>
            </div>

            <div className="mt-5 space-y-2">
              {filteredTransactions.length ? (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id || `${transaction.vendor}-${transaction.amount}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#7A2348]/10 p-3.5 transition-shadow duration-150 hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#7A2348]/8 text-[#7A2348]">
                        <Receipt className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[12.5px] font-semibold text-[#292525]">
                          {transaction.vendor ||
                            transaction.description ||
                            "Transaction"}
                        </p>
                        <p className="mt-0.5 truncate text-[10.5px] text-[#7A2348]/55">
                          {transaction.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-[12.5px] font-semibold text-[#7A2348]">
                        {formatMoney(transaction.amount)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#7A2348]/55">
                        {transaction.status || "Saved"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#7A2348]/25 px-5 py-9 text-center">
                  <Receipt className="mx-auto h-7 w-7 text-[#7A2348]/45" />
                  <p className="mt-3 text-sm font-semibold text-[#7A2348]">
                    No transaction activity yet
                  </p>
                  <p className="mt-1 text-[12px] text-[#7A2348]/60">
                    Saved financial activity will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recommended vendors */}
          <div className="rounded-[28px] border border-[#7A2348]/18 bg-[#F3E7D3] p-6 shadow-[0_10px_28px_rgba(90,24,53,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A2348]/60">
                  Marketplace
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-[#7A2348]">
                  Vendors for your next event
                </h2>
              </div>

              <Link
                to="/marketplace"
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#7A2348] transition hover:underline"
              >
                Browse
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {stats.topVendors.length ? (
                stats.topVendors.map((vendor) => (
                  <Link
                    key={vendor.id || vendor.name}
                    to="/marketplace"
                    className="group rounded-2xl border border-[#7A2348]/10 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#7A2348]/30 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#7A2348]/8 text-[#7A2348]">
                        <Store className="h-4 w-4" />
                      </div>

                      <ArrowUpRight className="h-4 w-4 text-[#7A2348]/40 transition group-hover:text-[#7A2348]" />
                    </div>

                    <p className="mt-4 truncate text-[13px] font-semibold text-[#292525]">
                      {vendor.name || "Vendor"}
                    </p>

                    <p className="mt-1 truncate text-[10.5px] text-[#7A2348]/60">
                      {vendor.category || "Event service"}
                      {vendor.city ? ` · ${vendor.city}` : ""}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-[#7A2348]/25 px-5 py-9 text-center">
                  <Store className="mx-auto h-7 w-7 text-[#7A2348]/45" />
                  <p className="mt-3 text-sm font-semibold text-[#7A2348]">
                    No vendors available yet
                  </p>
                  <Link
                    to="/marketplace"
                    className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-[#7A2348]"
                  >
                    Open marketplace
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bottom quick actions */}
        <section className="mt-5 rounded-[28px] border border-[#7A2348]/18 bg-[#F3E7D3] p-5 shadow-[0_10px_28px_rgba(90,24,53,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A2348]/60">
                Quick actions
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[#7A2348]">
                What do you want to work on?
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 rounded-full border border-[#7A2348]/25 px-4 py-2.5 text-[12px] font-semibold text-[#7A2348] transition hover:border-[#7A2348] hover:bg-[#EBD9BC]"
              >
                <Store className="h-3.5 w-3.5" />
                Find a vendor
              </Link>

              <Link
                to="/financial-tracker"
                className="inline-flex items-center gap-2 rounded-full border border-[#7A2348]/25 px-4 py-2.5 text-[12px] font-semibold text-[#7A2348] transition hover:border-[#7A2348] hover:bg-[#EBD9BC]"
              >
                <Wallet className="h-3.5 w-3.5" />
                Check finances
              </Link>

              <Link
                to="/messages"
                className="inline-flex items-center gap-2 rounded-full bg-[#7A2348] px-4 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#5A1835]"
              >
                Open messages
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      {payingBooking ? (
        <PayVendorModal
          booking={payingBooking}
          onClose={() => setPayingBooking(null)}
          onPaid={() => {
            setPayingBooking(null);
            refreshBookings();
            refreshDashboard();
          }}
        />
      ) : null}

      {reviewingBooking ? (
        <ReviewModal
          booking={reviewingBooking}
          onClose={() => setReviewingBooking(null)}
          onSubmitted={() => {
            setReviewingBooking(null);
            refreshBookings();
            refreshDashboard();
          }}
        />
      ) : null}
    </AdminLayout>
  );
}

export default DashboardPage;