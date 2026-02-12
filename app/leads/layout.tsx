import { LeadsLayoutClient } from "@/components/providers/leads-layout-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead Generator - Find Business Leads",
  description:
    "Search for business leads by category and location. Export results to CSV.",
};

export default function LeadsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LeadsLayoutClient>{children}</LeadsLayoutClient>
  );
}
