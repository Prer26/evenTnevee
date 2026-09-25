import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../auth.js";
import { logApiError } from "../logger.js";

const router = Router();

const companyProfileSchema = z.object({
  full_name: z.string().trim().min(1),
  company_name: z.string().trim().min(1),
  industry: z.string().trim().min(1),
  location: z.string().trim().min(1),

  business_email: z.string().trim().email(),
  business_phone_country_code: z.string().trim().min(1),
  business_phone_number: z.string().trim().min(1),

  website: z.string().trim().optional().nullable(),
  founded_year: z.number().int().optional().nullable(),
  company_size: z.string().trim().optional().nullable(),

  about_company: z.string().trim().min(1),
  company_type: z.string().trim().min(1),

  company_linkedin: z.string().trim().optional().nullable(),
  instagram: z.string().trim().optional().nullable(),

  services: z.array(z.any()).optional(),

  logo_url: z.string().optional().nullable(),
  logo_crop: z.any().optional(),

  banner_url: z.string().optional().nullable(),
  banner_crop: z.any().optional(),

  founder_name: z.string().trim().optional().nullable(),
  founder_title: z.string().trim().optional().nullable(),
  founder_email: z.string().trim().email().optional().nullable(),

  founder_phone_country_code: z.string().trim().optional().nullable(),
  founder_phone_number: z.string().trim().optional().nullable(),

  founder_linkedin: z.string().trim().optional().nullable(),
  founder_bio: z.string().optional().nullable(),

  founder_photo_url: z.string().optional().nullable(),
  founder_photo_crop: z.any().optional(),

  team_members: z.array(z.any()).optional(),

  profile_completion: z.number().int().min(0).max(100).optional(),
  is_verified: z.boolean().optional(),
});

function toApiProfile(profile) {
  if (!profile) return null;

  return {
    id: profile.id,

    user_id: profile.userId,
    email: profile.email,

    full_name: profile.fullName,
    company_name: profile.companyName,
    industry: profile.industry,
    location: profile.location,

    business_email: profile.businessEmail,
    business_phone_country_code: profile.businessPhoneCountryCode,
    business_phone_number: profile.businessPhoneNumber,

    website: profile.website,
    founded_year: profile.foundedYear,
    company_size: profile.companySize,

    about_company: profile.aboutCompany,
    company_type: profile.companyType,

    company_linkedin: profile.companyLinkedin,
    instagram: profile.instagram,

    services: profile.services || [],

    logo_url: profile.logoUrl,
    logo_crop: profile.logoCrop || {},

    banner_url: profile.bannerUrl,
    banner_crop: profile.bannerCrop || {},

    founder_name: profile.founderName,
    founder_title: profile.founderTitle,
    founder_email: profile.founderEmail,

    founder_phone_country_code: profile.founderPhoneCountryCode,
    founder_phone_number: profile.founderPhoneNumber,

    founder_linkedin: profile.founderLinkedin,
    founder_bio: profile.founderBio,

    founder_photo_url: profile.founderPhotoUrl,
    founder_photo_crop: profile.founderPhotoCrop || {},

    team_members: profile.teamMembers || [],

    profile_completion: profile.profileCompletion,
    is_verified: profile.isVerified,

    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

function toPrismaData(data, user) {
  return {
    userId: user.id,
    email: user.email,

    fullName: data.full_name,
    companyName: data.company_name,
    industry: data.industry,
    location: data.location,

    businessEmail: data.business_email,
    businessPhoneCountryCode: data.business_phone_country_code,
    businessPhoneNumber: data.business_phone_number,

    website: data.website || null,
    foundedYear: data.founded_year ?? null,
    companySize: data.company_size || null,

    aboutCompany: data.about_company,
    companyType: data.company_type,

    companyLinkedin: data.company_linkedin || null,
    instagram: data.instagram || null,

    services: data.services || [],

    logoUrl: data.logo_url || null,
    logoCrop: data.logo_crop || {},

    bannerUrl: data.banner_url || null,
    bannerCrop: data.banner_crop || {},

    founderName: data.founder_name || null,
    founderTitle: data.founder_title || null,
    founderEmail: data.founder_email || null,

    founderPhoneCountryCode:
      data.founder_phone_country_code || null,

    founderPhoneNumber:
      data.founder_phone_number || null,

    founderLinkedin: data.founder_linkedin || null,
    founderBio: data.founder_bio || null,

    founderPhotoUrl: data.founder_photo_url || null,
    founderPhotoCrop: data.founder_photo_crop || {},

    teamMembers: data.team_members || [],

    profileCompletion: data.profile_completion ?? 0,

    // Never allow the client to change verification status.
    // Verification should be controlled by the backend/admin.
  };
}

/*
 * GET /api/company-profiles
 *
 * Returns the authenticated user's company profile as an array.
 * The frontend's existing .list() method expects an array.
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const profile = await prisma.companyProfile.findUnique({
      where: {
        userId: req.auth.sub,
      },
    });

    return res.json(profile ? [toApiProfile(profile)] : []);
  } catch (error) {
    logApiError(error, req);
    return res.status(500).json({
      message: "Unable to load company profile",
    });
  }
});

/*
 * GET /api/company-profiles/:id
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const profile = await prisma.companyProfile.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!profile) {
      return res.status(404).json({
        message: "Company profile not found",
      });
    }

    if (profile.userId !== req.auth.sub) {
      return res.status(403).json({
        message: "You are not allowed to access this profile",
      });
    }

    return res.json(toApiProfile(profile));
  } catch (error) {
    logApiError(error, req);
    return res.status(500).json({
      message: "Unable to load company profile",
    });
  }
});

/*
 * POST /api/company-profiles
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const parsed = companyProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid company profile data",
        errors: parsed.error.flatten(),
      });
    }

    const existing = await prisma.companyProfile.findUnique({
      where: {
        userId: req.auth.sub,
      },
    });

    if (existing) {
      return res.status(409).json({
        message: "Company profile already exists",
        profile: toApiProfile(existing),
      });
    }

    const profile = await prisma.companyProfile.create({
      data: {
        id: nanoid(),
        ...toPrismaData(parsed.data, {
          id: req.auth.sub,
          email: req.auth.email,
        }),
      },
    });

    return res.status(201).json(toApiProfile(profile));
  } catch (error) {
    logApiError(error, req);

    return res.status(500).json({
      message: "Unable to create company profile",
    });
  }
});

/*
 * PUT /api/company-profiles/:id
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const parsed = companyProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid company profile data",
        errors: parsed.error.flatten(),
      });
    }

    const existing = await prisma.companyProfile.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Company profile not found",
      });
    }

    if (existing.userId !== req.auth.sub) {
      return res.status(403).json({
        message: "You are not allowed to update this profile",
      });
    }

    const profile = await prisma.companyProfile.update({
      where: {
        id: req.params.id,
      },
      data: toPrismaData(parsed.data, {
        id: req.auth.sub,
        email: req.auth.email,
      }),
    });

    return res.json(toApiProfile(profile));
  } catch (error) {
    logApiError(error, req);

    return res.status(500).json({
      message: "Unable to update company profile",
    });
  }
});

/*
 * PATCH /api/company-profiles/:id
 *
 * Supported too, in case the frontend's entity client uses PATCH.
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const parsed = companyProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid company profile data",
        errors: parsed.error.flatten(),
      });
    }

    const existing = await prisma.companyProfile.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Company profile not found",
      });
    }

    if (existing.userId !== req.auth.sub) {
      return res.status(403).json({
        message: "You are not allowed to update this profile",
      });
    }

    const profile = await prisma.companyProfile.update({
      where: {
        id: req.params.id,
      },
      data: toPrismaData(parsed.data, {
        id: req.auth.sub,
        email: req.auth.email,
      }),
    });

    return res.json(toApiProfile(profile));
  } catch (error) {
    logApiError(error, req);

    return res.status(500).json({
      message: "Unable to update company profile",
    });
  }
});

export default router;