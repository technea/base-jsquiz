import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Master JavaScript in 10 levels of quizzes",
  description: "10 levels of JavaScript quizzes to master your coding skills.",
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
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
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}
