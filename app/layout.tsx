import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
    'base:app_id': '694bd919c63ad876c9081188',
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
      <body className={`${montserrat.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
