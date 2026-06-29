import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinicSuite SaaS — Chamber & Clinic Management Platform",
  description: "Production-ready multi-tenant SaaS for doctors and clinics to manage calendar scheduling, receptionist workflows, patient records, and recurring billing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

