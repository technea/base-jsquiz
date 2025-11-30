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
  title: "JavaScript Quiz Miniapp",
  description: "A 10-level JavaScript quiz challenge. Test your JavaScript knowledge across 10 levels of increasing difficulty.",
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://base-jsquiz.vercel.app/og-pro.png',
      button: {
        title: 'Launch Quiz',
        action: {
          type: 'launch_miniapp',
          name: 'JavaScript Quiz Miniapp',
          url: 'https://base-jsquiz.vercel.app',
          splashImageUrl: 'https://base-jsquiz.vercel.app/splash-pro.png',
          splashBackgroundColor: '#0f172a',
        },
      },
    }),
  },
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
        {children}
      </body>
    </html>
  );
}
