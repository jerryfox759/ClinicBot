import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinicBot AI — Doctor Chamber Automation Platform",
  description: "Production-ready multi-tenant SaaS automating appointment booking via WhatsApp, Gemini AI, and n8n.",
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

