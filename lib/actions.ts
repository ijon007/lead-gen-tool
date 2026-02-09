"use server";

import { searchPlaces } from "@/lib/placesClient";
import type { Lead } from "@/types";

export async function searchPlacesAction(
  category: string,
  location: string
): Promise<{ leads: Lead[] } | { error: string }> {
  const cat = category?.trim() ?? "";
  const loc = location?.trim() ?? "";

  if (!cat && !loc) {
    return { error: "Category and location cannot both be empty" };
  }

  try {
    const leads = await searchPlaces(cat, loc);
    return { leads };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[searchPlacesAction]", err);
    return { error: message };
  }
}
