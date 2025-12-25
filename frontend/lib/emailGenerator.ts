export const generateEmailVariations = (fullName: string): string[] => {
  const clean = fullName.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const parts = clean.split(/\s+/).filter((p) => p.length > 0);

  if (parts.length === 0) return [];

  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : "";

  const variations = [
    `${first}${last}`, // budisantoso
    `${first[0]}${last}`, // bsantoso
    `${first}.${last}`, // budi.santoso
    `${last}.${first}`, // santoso.budi
    `${first}${last.substring(0, 3)}`, // budisan
    `${first}`, // budi (fallback)
  ];

  // Remove duplicates and empty strings, and ensure reasonable length
  return [...new Set(variations)].filter((v) => v.length > 2);
};
