import prisma from "./lib/prisma.js";

export async function getOwnedVendorId(userId) {
  if (!userId) return null;
  const vendor = await prisma.vendor.findFirst({
    where: { userId },
    select: { id: true },
  });
  return vendor?.id || null;
}
