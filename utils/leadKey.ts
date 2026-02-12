export function getExistingLeadKey(lead: {
  googleMapsUri?: string | null;
  businessName?: string | null;
  address?: string | null;
}): string {
  if (lead.googleMapsUri?.trim()) return lead.googleMapsUri.trim();
  const name = (lead.businessName ?? "").trim();
  const addr = (lead.address ?? "").trim();
  return `${name}::${addr}`;
}
