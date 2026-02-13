export interface Lead {
  id: string;
  businessName: string;
  category: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description?: string;
  status?: string;
  rating?: number;
  googleMapsUri?: string;
  instagram?: string;
  facebook?: string;
  linkedIn?: string;
  x?: string;
  notes?: string;
  qualification?: "High" | "Low" | "Skip";
  qualificationScore?: number;
  qualificationReasoning?: string;
  qualificationCriteria?: Array<{
    criterion: string;
    met: boolean;
    evidence: string;
    points: number;
  }>;
}

export interface SearchParams {
  category: string;
  location: string;
  limit?: number;
  nextPageToken?: string | null;
}

export interface TableColumnConfig {
  id: keyof Lead | string;
  label: string;
  visible: boolean;
}

export interface SheetState {
  id: string;
  name: string;
  leads: Lead[];
  searchParams: SearchParams | null;
  columns: TableColumnConfig[];
}
