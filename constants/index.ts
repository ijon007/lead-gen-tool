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

export type CategoryItem = { value: string; label: string };

export const CATEGORIES: CategoryItem[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "hotel", label: "Hotel" },
  { value: "guest-house", label: "Guest House" },
  { value: "apartment", label: "Apartment" },
  { value: "residential", label: "Residential" },
  { value: "technology", label: "Technology" },
  { value: "real-estate", label: "Real Estate" },
  { value: "finance", label: "Finance" },
  { value: "hospitality", label: "Hospitality" },
  { value: "automotive", label: "Automotive" },
  { value: "beauty", label: "Beauty & Wellness" },
];

export const DEFAULT_TABLE_COLUMNS: TableColumnConfig[] = [
  { id: "businessName", label: "Business Name", visible: true },
  { id: "category", label: "Category", visible: true },
  { id: "location", label: "Location", visible: true },
  { id: "email", label: "Email", visible: true },
  { id: "phone", label: "Phone", visible: true },
  { id: "website", label: "Website", visible: true },
  { id: "address", label: "Address", visible: true },
  { id: "rating", label: "Rating", visible: false },
  { id: "description", label: "Description", visible: false },
  { id: "instagram", label: "Instagram", visible: true },
  { id: "facebook", label: "Facebook", visible: true },
  { id: "linkedIn", label: "LinkedIn", visible: false },
  { id: "x", label: "X", visible: false },
  { id: "notes", label: "Notes", visible: true },
  { id: "qualification", label: "Qualification", visible: true },
  { id: "googleMapsUri", label: "Google Maps", visible: false },
];
