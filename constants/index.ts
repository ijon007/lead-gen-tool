import type { TableColumnConfig } from "@/types";

export const LEAD_STATUSES = [
  { value: "rejected", label: "Rejected" },
  { value: "booked", label: "Booked" },
  { value: "closed", label: "Closed" },
  { value: "voicemail", label: "Voicemail" },
  { value: "open", label: "Open" },
  { value: "waiting", label: "Waiting" },
  { value: "does-not-exist", label: "Does not exist" },
  { value: "waiting-plus", label: "Strong" },
] as const;

export const CATEGORIES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "technology", label: "Technology" },
  { value: "real-estate", label: "Real Estate" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance" },
  { value: "hospitality", label: "Hospitality" },
  { value: "automotive", label: "Automotive" },
  { value: "beauty", label: "Beauty & Wellness" },
] as const;

export const DEFAULT_TABLE_COLUMNS: TableColumnConfig[] = [
  { id: "businessName", label: "Business Name", visible: true },
  { id: "category", label: "Category", visible: true },
  { id: "location", label: "Location", visible: true },
  { id: "email", label: "Email", visible: true },
  { id: "phone", label: "Phone", visible: true },
  { id: "website", label: "Website", visible: false },
  { id: "address", label: "Address", visible: false },
  { id: "rating", label: "Rating", visible: false },
  { id: "description", label: "Description", visible: false },
  { id: "socialMedia", label: "Social Media", visible: false },
  { id: "googleMapsUri", label: "Google Maps", visible: false },
];
