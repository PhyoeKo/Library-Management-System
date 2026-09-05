import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MOCHT စာကြည့်တိုက် | Ministry of Culture, Hotels and Tourism - National LMS",
  description:
    "ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော် ယဉ်ကျေးမှု၊ ဟိုတယ်နှင့် ခရီးသွားလာရေး ဝန်ကြီးဌာန - အမျိုးသား ဒစ်ဂျစ်တယ် စာကြည့်တိုက် စီမံခန့်ခွဲမှု စနစ် (MOCHT Library Management System for all Citizens of Myanmar).",
  icons: {
    icon: [
      { url: "/mocht-logo.png", type: "image/png" },
    ],
    shortcut: "/mocht-logo.png",
    apple: "/mocht-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
