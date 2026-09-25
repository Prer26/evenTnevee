import React, { useMemo, useState } from "react";
import {
  User, MapPin, Building2, Mail, Phone, Globe, Linkedin, Instagram,
  BriefcaseBusiness, CalendarDays, Award, Plus, Pencil, Camera, Check,
  ChevronRight, ExternalLink,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/lib/AuthContext";

const expertiseOptions = [
  "Weddings", "Corporate Events", "Conferences", "Engagements",
  "Birthday Celebrations", "Product Launches", "Private Events",
  "Destination Events",
];

const serviceOptions = [
  "Event Planning", "Vendor Management", "Wedding Planning",
  "Corporate Events", "Budget Management", "On-site Coordination",
];

function getDisplayName(user) {
  return user?.full_name || user?.name || user?.display_name ||
    user?.profile?.full_name || user?.profile?.name ||
    user?.email?.split("@")[0] || "Your Name";
}

function getInitials(name) {
  return name.split(" ").filter(Boolean).slice(0, 2)
    .map((word) => word[0]).join("").toUpperCase();
}

function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="rounded-3xl border border-[#7A2348]/15 bg-[#F3E7D3] p-6 md:p-7">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBD9BC] text-[#7A2348]">
            <Icon size={19} />
          </div>
          <h2 className="text-lg font-semibold text-[#292525]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#7A2348]"><Icon size={17} /></div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[#756B65]">{label}</p>
        <p className="mt-1 text-sm font-medium text-[#292525]">{value || "Not added yet"}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: displayName,
    title: user?.role || "Event Planner",
    company: user?.company_name || user?.company || "",
    location: user?.location || user?.city || "",
    email: user?.email || "",
    phone: user?.phone || "",
    website: user?.website || "",
    linkedin: user?.linkedin || "",
    instagram: user?.instagram || "",
    bio: user?.bio || "",
    experience: user?.experience || "",
    specialization: user?.specialization || "",
    languages: user?.languages || "",
    expertise: user?.expertise || [],
    services: user?.services || [],
    photo: user?.profile_photo || user?.avatar_url || "",
  });

  const [experience, setExperience] = useState(user?.experience_history || []);
  const [portfolio, setPortfolio] = useState(user?.portfolio || []);

  const completion = useMemo(() => {
    const fields = [
      profile.name, profile.title, profile.company, profile.location,
      profile.email, profile.bio, profile.experience, profile.specialization,
      profile.languages, profile.expertise?.length, profile.services?.length,
      profile.photo,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [profile]);

  const update = (field, value) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const toggle = (field, item) => {
    setProfile((prev) => {
      const current = prev[field] || [];
      return {
        ...prev,
        [field]: current.includes(item)
          ? current.filter((x) => x !== item)
          : [...current, item],
      };
    });
  };

  const save = () => {
    setEditing(false);
    console.log("Profile updated:", {
      ...profile,
      experience_history: experience,
      portfolio,
    });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#F3E7D3] px-4 py-6 text-[#292525] md:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">

          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#7A2348]">Professional Profile</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Your Profile</h1>
              <p className="mt-1 text-sm text-[#756B65]">
                Build your professional identity on Eventneve.
              </p>
            </div>
            <button
              onClick={() => editing ? save() : setEditing(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7A2348] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#641B3B]"
            >
              {editing ? <Check size={16} /> : <Pencil size={16} />}
              {editing ? "Save Profile" : "Edit Profile"}
            </button>
          </div>

          <section className="overflow-hidden rounded-3xl border border-[#7A2348]/15 bg-[#F3E7D3]">
            <div className="relative h-32 bg-[#7A2348] md:h-40">
              <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full border-[40px] border-[#F3E7D3]/20" />
              <div className="absolute right-40 top-12 h-32 w-32 rounded-full border-[20px] border-[#F3E7D3]/20" />
            </div>

            <div className="relative px-5 pb-6 md:px-8">
              <div className="-mt-14 flex flex-col gap-5 md:-mt-16 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-[#F3E7D3] bg-[#EBD9BC] md:h-32 md:w-32">
                    {profile.photo ? (
                      <img src={profile.photo} alt={profile.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[#7A2348]">
                        {initials}
                      </div>
                    )}
                    {editing && (
                      <button className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#7A2348] text-white">
                        <Camera size={15} />
                      </button>
                    )}
                  </div>

                  <div className="pb-1">
                    {editing ? (
                      <>
                        <input value={profile.name} onChange={(e) => update("name", e.target.value)}
                          className="mb-1 w-full rounded-lg border border-[#7A2348]/20 bg-[#F3E7D3] px-3 py-2 text-xl font-bold outline-none" />
                        <input value={profile.title} onChange={(e) => update("title", e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#7A2348]/20 bg-[#F3E7D3] px-3 py-2 text-sm outline-none"
                          placeholder="Professional title" />
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold md:text-3xl">{profile.name}</h2>
                        <p className="mt-1 text-sm font-medium text-[#7A2348]">
                          {profile.title || "Event Planner"}
                        </p>
                      </>
                    )}

                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#756B65]">
                      {profile.company && <span className="flex items-center gap-1.5"><Building2 size={14}/>{profile.company}</span>}
                      {profile.location && <span className="flex items-center gap-1.5"><MapPin size={14}/>{profile.location}</span>}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-64">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold">Profile completion</span>
                    <span className="font-bold text-[#7A2348]">{completion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EBD9BC]">
                    <div className="h-full rounded-full bg-[#7A2348]" style={{ width: `${completion}%` }} />
                  </div>
                </div>
              </div>

              <div className="mt-7 max-w-3xl">
                {editing ? (
                  <textarea value={profile.bio} onChange={(e) => update("bio", e.target.value)}
                    rows={3} placeholder="Write a short professional introduction..."
                    className="w-full rounded-xl border border-[#7A2348]/20 bg-[#F3E7D3] p-3 text-sm outline-none" />
                ) : (
                  <p className="text-sm leading-7 text-[#756B65]">
                    {profile.bio || "Add a short introduction about yourself, your event planning experience and the kind of events you specialise in."}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_1fr]">
            <div className="space-y-6">

              <Section title="About" icon={User}>
                {editing ? (
                  <textarea value={profile.bio} onChange={(e) => update("bio", e.target.value)}
                    rows={5} placeholder="Tell clients and event companies about your professional journey..."
                    className="w-full rounded-xl border border-[#7A2348]/20 bg-[#F3E7D3] p-4 text-sm leading-7 outline-none" />
                ) : (
                  <p className="text-sm leading-7 text-[#756B65]">
                    {profile.bio || "Your professional introduction will appear here once you complete your profile."}
                  </p>
                )}
              </Section>

              <Section title="Professional Information" icon={BriefcaseBusiness}>
                <div className="grid gap-6 sm:grid-cols-2">
                  <InfoItem icon={BriefcaseBusiness} label="Professional title" value={profile.title} />
                  <InfoItem icon={Building2} label="Company / Business" value={profile.company} />
                  <InfoItem icon={MapPin} label="Location" value={profile.location} />
                  <InfoItem icon={CalendarDays} label="Experience" value={profile.experience ? `${profile.experience} years` : ""} />
                  <InfoItem icon={BriefcaseBusiness} label="Specialization" value={profile.specialization} />
                  <InfoItem icon={Globe} label="Languages" value={profile.languages} />
                </div>

                {editing && (
                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <input value={profile.company} onChange={(e) => update("company", e.target.value)} placeholder="Company / Business name" className="field" />
                    <input value={profile.location} onChange={(e) => update("location", e.target.value)} placeholder="City / Location" className="field" />
                    <input value={profile.experience} onChange={(e) => update("experience", e.target.value)} placeholder="Years of experience" className="field" />
                    <input value={profile.specialization} onChange={(e) => update("specialization", e.target.value)} placeholder="Specialization" className="field" />
                    <input value={profile.languages} onChange={(e) => update("languages", e.target.value)} placeholder="Languages" className="field sm:col-span-2" />
                  </div>
                )}
              </Section>

              <Section title="Event Expertise" icon={CalendarDays}>
                <div className="flex flex-wrap gap-2.5">
                  {expertiseOptions.map((item) => {
                    const active = profile.expertise?.includes(item);
                    return (
                      <button key={item} disabled={!editing} onClick={() => toggle("expertise", item)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium ${active ? "border-[#7A2348] bg-[#7A2348] text-white" : "border-[#7A2348]/20 bg-[#EBD9BC] text-[#7A2348]"}`}>
                        {active && <Check size={14} className="mr-1 inline" />}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Services Offered" icon={BriefcaseBusiness}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {serviceOptions.map((service) => {
                    const active = profile.services?.includes(service);
                    return (
                      <button key={service} disabled={!editing} onClick={() => toggle("services", service)}
                        className={`flex items-center justify-between rounded-xl border p-4 text-left ${active ? "border-[#7A2348] bg-[#EBD9BC]" : "border-[#7A2348]/15 bg-[#F3E7D3]"}`}>
                        <span className="text-sm font-medium">{service}</span>
                        {active ? <Check size={17} className="text-[#7A2348]" /> : editing && <Plus size={17} />}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Experience" icon={BriefcaseBusiness}
                action={editing && <button onClick={() => setExperience([...experience, { role:"", company:"", duration:"", description:"" }])} className="flex items-center gap-1 text-sm font-semibold text-[#7A2348]"><Plus size={16}/> Add experience</button>}
              >
                {experience.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#7A2348]/20 p-7 text-center">
                    <BriefcaseBusiness size={28} className="mx-auto mb-3 text-[#7A2348]" />
                    <p className="text-sm font-semibold">Add your professional experience</p>
                    <p className="mt-1 text-sm text-[#756B65]">Showcase companies, roles and event experience.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {experience.map((item, index) => (
                      <div key={index} className="border-l-2 border-[#7A2348]/20 pl-5">
                        {editing ? (
                          <div className="space-y-3">
                            {["role","company","duration"].map((field) => (
                              <input key={field} value={item[field] || ""} onChange={(e) => {
                                const updated = [...experience]; updated[index][field] = e.target.value; setExperience(updated);
                              }} placeholder={field[0].toUpperCase()+field.slice(1)} className="field" />
                            ))}
                            <textarea value={item.description || ""} onChange={(e) => {
                              const updated = [...experience]; updated[index].description = e.target.value; setExperience(updated);
                            }} placeholder="Description" rows={3} className="field" />
                          </div>
                        ) : (
                          <>
                            <h3 className="font-semibold">{item.role || "Professional role"}</h3>
                            <p className="mt-1 text-sm font-medium text-[#7A2348]">{item.company || "Company"}</p>
                            <p className="mt-1 text-xs text-[#756B65]">{item.duration}</p>
                            <p className="mt-3 text-sm leading-6 text-[#756B65]">{item.description}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Portfolio & Work" icon={CalendarDays}
                action={editing && <button onClick={() => setPortfolio([...portfolio, {title:"",type:"",location:"",year:"",description:"",image:""}])} className="flex items-center gap-1 text-sm font-semibold text-[#7A2348]"><Plus size={16}/> Add work</button>}
              >
                {portfolio.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#7A2348]/20 p-8 text-center">
                    <CalendarDays size={30} className="mx-auto mb-3 text-[#7A2348]" />
                    <p className="font-semibold">Showcase your events</p>
                    <p className="mt-1 text-sm text-[#756B65]">Add events and projects you've worked on.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {portfolio.map((work, index) => (
                      <div key={index} className="overflow-hidden rounded-2xl border border-[#7A2348]/15">
                        <div className="flex h-40 items-center justify-center bg-[#EBD9BC]">
                          {work.image ? <img src={work.image} alt={work.title} className="h-full w-full object-cover" /> : <CalendarDays size={30} className="text-[#7A2348]" />}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold">{work.title || "Event project"}</h3>
                          <p className="mt-1 text-xs text-[#7A2348]">{work.type}{work.location ? ` · ${work.location}` : ""}</p>
                          <p className="mt-2 text-sm text-[#756B65]">{work.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Contact & Links" icon={Globe}>
                <div className="space-y-5">
                  <InfoItem icon={Mail} label="Email" value={profile.email} />
                  <InfoItem icon={Phone} label="Phone" value={profile.phone} />
                  <InfoItem icon={Globe} label="Website" value={profile.website} />

                  {editing && (
                    <div className="space-y-3 pt-2">
                      <input value={profile.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone number" className="field" />
                      <input value={profile.website} onChange={(e) => update("website", e.target.value)} placeholder="Website" className="field" />
                      <input value={profile.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="LinkedIn profile" className="field" />
                      <input value={profile.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="Instagram profile" className="field" />
                    </div>
                  )}

                  {!editing && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-[#EBD9BC] px-3 py-2 text-sm font-medium text-[#7A2348]"><Linkedin size={16}/> LinkedIn <ExternalLink size={13}/></a>}
                      {profile.instagram && <a href={profile.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-[#EBD9BC] px-3 py-2 text-sm font-medium text-[#7A2348]"><Instagram size={16}/> Instagram <ExternalLink size={13}/></a>}
                    </div>
                  )}
                </div>
              </Section>

              <section className="rounded-3xl border border-[#7A2348]/15 bg-[#7A2348] p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F3E7D3]/70">Profile strength</p>
                <h3 className="mt-3 text-xl font-bold">{completion >= 80 ? "Your profile is looking complete." : "Complete your profile."}</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">A complete professional profile helps event companies understand your experience, expertise and services.</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-[#F3E7D3]" style={{width:`${completion}%`}} /></div>
                <div className="mt-2 text-right text-xs text-white/70">{completion}% complete</div>
              </section>

              <Section title="Professional Details" icon={Award}>
                <div className="space-y-4">
                  <div className="flex justify-between"><span className="text-sm text-[#756B65]">Experience</span><span className="text-sm font-semibold">{profile.experience ? `${profile.experience} years` : "Not added"}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-[#756B65]">Specialization</span><span className="max-w-[55%] text-right text-sm font-semibold">{profile.specialization || "Not added"}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-[#756B65]">Expertise</span><span className="text-sm font-semibold">{profile.expertise?.length || 0} areas</span></div>
                  <div className="flex justify-between"><span className="text-sm text-[#756B65]">Services</span><span className="text-sm font-semibold">{profile.services?.length || 0} services</span></div>
                </div>
              </Section>

              <Section title="Certifications & Achievements" icon={Award}>
                <div className="rounded-2xl border border-dashed border-[#7A2348]/20 p-6 text-center">
                  <Award size={28} className="mx-auto mb-3 text-[#7A2348]" />
                  <p className="text-sm font-semibold">Add your achievements</p>
                  <p className="mt-1 text-xs leading-5 text-[#756B65]">Certifications, awards and professional milestones can be displayed here.</p>
                </div>
              </Section>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-[#7A2348]/15 bg-[#EBD9BC] p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A2348]">Eventneve Professional Profile</p>
                <h2 className="mt-2 text-xl font-bold md:text-2xl">Your profile represents your work.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756B65]">Keep your professional information, expertise and experience updated so your Eventneve workspace always reflects who you are.</p>
              </div>
              <button onClick={() => setEditing(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#7A2348] px-5 py-3 text-sm font-semibold text-white hover:bg-[#641B3B]">
                Complete Profile <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(122,35,72,.2);
          background: #F3E7D3;
          padding: .75rem 1rem;
          font-size: .875rem;
          outline: none;
        }
        .field:focus { border-color: #7A2348; }
      `}</style>
    </AdminLayout>
  );
}
