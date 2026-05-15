import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "EHIS – Sistem Informasi Rumah Sakit",
    template: "%s | EHIS",
  },
  description: "EHIS — Sistem Informasi Rumah Sakit terintegrasi untuk pelayanan kesehatan yang optimal.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
