import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "JAZZMINI | The Ultimate JS Blueprint",
  description: "Prepare for your JavaScript interview and master JS through 10 immersive levels of technical challenges and Web3 rewards.",
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://base-jsquiz.vercel.app/og-pro.png',
      button: {
        title: 'Enter Nexus',
        action: {
          type: 'launch_miniapp',
          name: 'JAZZMINI Quiz',
          url: 'https://base-jsquiz.vercel.app',
          splashImageUrl: 'https://base-jsquiz.vercel.app/splash-pro.png',
          splashBackgroundColor: '#020617',
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
      <body className={`${outfit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
