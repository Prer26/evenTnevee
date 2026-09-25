import { base44 } from "@/api/base44Client";

const ENTITY = () => base44.entities.CompanyProfile;

export const getCompanyProfile = async (user) => {
  if (!user?.id && !user?.email) return null;

  const records = await ENTITY().list("-created_date", 100);

  return (
    (records || []).find(
      (record) =>
        (user?.id && record.user_id === user.id) ||
        (user?.email && record.email === user.email)
    ) || null
  );
};

export const createCompanyProfile = async (payload) => {
  return await ENTITY().create(payload);
};

export const updateCompanyProfile = async (id, payload) => {
  if (!id) {
    throw new Error("Company profile id is required.");
  }

  return await ENTITY().update(id, payload);
};

export const saveCompanyProfile = async (user, data, recordId = null) => {
  if (!user?.id && !user?.email) {
    throw new Error("User information is missing.");
  }

  const payload = {
    user_id: user?.id || "",
    email: user?.email || "",

    full_name: data?.full_name || "",
    company_name: data?.company_name || "",
    industry: data?.industry || "",
    location: data?.location || "",

    business_email: data?.business_email || "",
    business_phone_country_code:
      data?.business_phone_country_code || "+91",
    business_phone_number:
      data?.business_phone_number || "",

    about_company: data?.about_company || "",
    company_type: data?.company_type || "",

    website: data?.website || "",
    founded_year: data?.founded_year || "",
    company_size: data?.company_size || "",
    company_linkedin: data?.company_linkedin || "",
    instagram: data?.instagram || "",

    logo_url: data?.logo_url || "",
    banner_url: data?.banner_url || "",

    founder_name: data?.founder_name || "",
    founder_title:
      data?.founder_title || "Founder & CEO",
    founder_email: data?.founder_email || "",
    founder_phone_country_code:
      data?.founder_phone_country_code || "+91",
    founder_phone_number:
      data?.founder_phone_number || "",
    founder_linkedin:
      data?.founder_linkedin || "",
    founder_bio:
      data?.founder_bio || "",
    founder_photo_url:
      data?.founder_photo_url || "",

    profile_completion:
      Number(data?.profile_completion || 0),

    is_verified:
      Boolean(data?.is_verified),
  };

  console.log(
    "SENDING COMPANY PROFILE:",
    payload
  );

  try {
    if (recordId) {
      return await updateCompanyProfile(
        recordId,
        payload
      );
    }

    const existing =
      await getCompanyProfile(user);

    if (existing?.id) {
      return await updateCompanyProfile(
        existing.id,
        payload
      );
    }

    return await createCompanyProfile(payload);
  } catch (error) {
    console.error(
      "COMPANY PROFILE SAVE ERROR:",
      error
    );

    throw error;
  }
};