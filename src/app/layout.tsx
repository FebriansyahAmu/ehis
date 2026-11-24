import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastViewport from "@/components/ui/ToastViewport";

// Font global = Geist Sans + Geist Mono (keluarga yang dipakai situs shadcn/ui), satu keluarga
// untuk teks DAN judul. Font variabel → satu berkas untuk semua ketebalan. next/font meng-host
// sendiri dan membuat font cadangan bermetrik (size-adjust/ascent-override) agar teks tidak
// melompat saat font selesai dimuat. Token Tailwind font-sans/font-mono ada di globals.css.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
