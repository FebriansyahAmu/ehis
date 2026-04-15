import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SIMRS – Sistem Informasi Manajemen Rumah Sakit",
    template: "%s | SIMRS",
  },
  description: "Sistem Informasi Manajemen Rumah Sakit terintegrasi untuk pelayanan kesehatan yang optimal.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
