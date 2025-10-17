import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SidplayerFp Remote",
  description: "For controlling SidplayerFp remotely",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main className="flex content-center justify-center min-h-screen bg-gray-900 text-amber-50">
          <section className="bg-black pl-30 pr-30 pt-10">{children}</section>
        </main>
      </body>
    </html>
  );
}
