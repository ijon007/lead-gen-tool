import { SEARCH_RESULT_LIMIT } from "@/constants/categories";
import type { Lead } from "@/types";
import type { PlaceResult, SearchTextResponse } from "@/types/places";

const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.internationalPhoneNumber,places.websiteUri,places.rating,places.googleMapsUri,places.businessStatus";

function mapBusinessStatusToLeadStatus(businessStatus?: string): string {
  if (!businessStatus) return "open";
  switch (businessStatus) {
    case "OPERATIONAL":
      return "open";
    case "CLOSED_TEMPORARILY":
    case "CLOSED_PERMANENTLY":
      return "closed";
    default:
      return "open";
  }
}

function placeToLead(place: PlaceResult, category: string, location: string): Lead {
  const id = place.id?.replace(/^places\//, "") ?? crypto.randomUUID();
  const website = place.websiteUri ?? "";
  return {
    id,
    businessName: place.displayName?.text ?? "",
    category,
    location,
    email: "",
    phone: place.internationalPhoneNumber ?? "",
    website,
    address: place.formattedAddress ?? "",
    description: undefined,
    status: mapBusinessStatusToLeadStatus(place.businessStatus),
    rating: place.rating,
    googleMapsUri: place.googleMapsUri,
    socialMedia: "",
  };
}

export async function searchPlaces(
  category: string,
  location: string
): Promise<Lead[]> {
  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ?? process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

  const textQuery = [category, location].filter(Boolean).join(" in ");
  if (!textQuery.trim()) {
    throw new Error("Category and location cannot both be empty");
  }

  const res = await fetch(PLACES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "en",
      pageSize: SEARCH_RESULT_LIMIT,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message: string;
    try {
      const json = JSON.parse(text) as { error?: { message?: string } };
      message = json.error?.message ?? text;
    } catch {
      message = text || `HTTP ${res.status}`;
    }
    throw new Error(`Places API error: ${message}`);
  }

  const data = (await res.json()) as SearchTextResponse;
  const places = data.places ?? [];
  return places.map((p) => placeToLead(p, category, location));
}
