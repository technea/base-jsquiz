import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjE0NDk4NjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhDMUM1NEZmQWMwNzM5OGRlNjExQjE5QUU3MWM3NjAxQzgyYzI5NWFGIn0",
      payload: "eyJkb21haW4iOiJiYXNlLWpzcXVpei52ZXJjZWwuYXBwIn0",
      signature: "tluJ/iupgN8BPDCk/k6DrzJyql3RJUZJULX7z3fHQY5K2/N3rveIpbXlXFtbM2xdYUyP7Shy/esKER8HftjYJxs="
    },
    frame: {
      version: "1",
      name: "JavaScript Quiz Miniapp",
      iconUrl: "https://base-jsquiz.vercel.app/icon-pro.png",
      homeUrl: "https://base-jsquiz.vercel.app",
      imageUrl: "https://base-jsquiz.vercel.app/og-pro.png",
      buttonTitle: "Start Quiz",
      splashImageUrl: "https://base-jsquiz.vercel.app/splash-pro.png",
      splashBackgroundColor: "#0f172a",
      webhookUrl: "https://base-jsquiz.vercel.app/api/webhook",
      subtitle: "Test Your JavaScript Knowledge",
      description: "A 10-level JavaScript quiz challenge. Pass each level with 7/10 correct answers to unlock the next level.",
      screenshotUrls: [
        "https://base-jsquiz.vercel.app/og-pro.png",
        "https://base-jsquiz.vercel.app/splash-pro.png"
      ],
      primaryCategory: "education",
      tags: [
        "javascript",
        "quiz",
        "education",
        "learning",
        "base"
      ],
      heroImageUrl: "https://base-jsquiz.vercel.app/og-pro.png",
      tagline: "Master JavaScript One Level at a Time",
      ogTitle: "JavaScript Quiz Miniapp",
      ogDescription: "Test your JavaScript knowledge across 10 levels of increasing difficulty. Challenge yourself and unlock all levels!",
      ogImageUrl: "https://base-jsquiz.vercel.app/og-pro.png",
      noindex: false
    }
  };

  const response = NextResponse.json(manifest);
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  response.headers.set('Content-Type', 'application/json');
  return response;
}
