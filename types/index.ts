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
}

export interface SearchParams {
  category: string;
  location: string;
}

export interface TableColumnConfig {
  id: keyof Lead | string;
  label: string;
  visible: boolean;
}
