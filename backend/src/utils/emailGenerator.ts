import { db } from "../config/db";

const prisma = db;

export const generateInstitutionalEmail = async (
  fullName: string
): Promise<string> => {
  // 1. Clean and split
  // "Budi Santoso" -> "budi santoso" -> ["budi", "santoso"]
  const cleanName = fullName.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const parts = cleanName.split(/\s+/);

  let baseName = "";

  if (parts.length === 1) {
    baseName = parts[0]; // "budi" -> "budi"
  } else {
    // "budi santoso" -> "bsantoso"
    // "muhammad fajar hidayat" -> "mhidayat" (First letter of first + Last name)
    const firstInitial = parts[0][0];
    const lastName = parts[parts.length - 1];
    baseName = `${firstInitial}${lastName}`;
  }

  // 2. Truncate to max 10 chars to keep it short
  if (baseName.length > 10) {
    baseName = baseName.substring(0, 10);
  }

  let email = `${baseName}@chainnesa.com`;
  let counter = 1;

  // 3. Check uniqueness loop
  // If "bsantoso@chainnesa.com" exists, try "bsantoso1@...", "bsantoso2@..."
  while (await prisma.user.findUnique({ where: { email } })) {
    email = `${baseName}${counter}@chainnesa.com`;
    counter++;
  }

  return email;
};
