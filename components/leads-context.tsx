"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface LeadsContextValue {
  generatingSheetId: string | null;
  setGeneratingSheetId: (id: string | null) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [generatingSheetId, setGeneratingSheetId] = useState<string | null>(null);
  return (
    <LeadsContext.Provider value={{ generatingSheetId, setGeneratingSheetId }}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeadsContext() {
  const ctx = useContext(LeadsContext);
  if (!ctx) {
    throw new Error("useLeadsContext must be used within LeadsProvider");
  }
  return ctx;
}
