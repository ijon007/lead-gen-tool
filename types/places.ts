export interface LocalizedText {
  text?: string;
  languageCode?: string;
}

export interface PlaceResult {
  id?: string;
  displayName?: LocalizedText;
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  googleMapsUri?: string;
  businessStatus?: string;
}

export interface SearchTextResponse {
  places?: PlaceResult[];
  nextPageToken?: string;
}
