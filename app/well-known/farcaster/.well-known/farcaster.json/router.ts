export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjE0NDk4NjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhDMUM1NEZmQWMwNzM5OGRlNjExQjE5QUU3MWM3NjAxQzgyYzI5NWFGIn0",
      payload: "eyJkb21haW4iOiJiYXNlLWpzcXVpei52ZXJjZWwuYXBwIn0",
      signature: "tluJ/iupgN8BPDCk/k6DrzJyql3RJUZJULX7z3fHQY5K2/N3rveIpbXlXFtbM2xdYUyP7Shy/esKER8HftjYJxs="
    },

    miniapp: {
      version: "1",
      name: "JavaScript Quiz Miniapp",
      homeUrl: "https://base-jsquiz.vercel.app",
      iconUrl: "https://base-jsquiz.vercel.app/icon-pro.png",
      splashImageUrl: "https://base-jsquiz.vercel.app/splash-pro.png",
      splashBackgroundColor: "#0f172a",
      webhookUrl: "https://base-jsquiz.vercel.app/api/webhook",

      subtitle: "Test Your Skills",

      description: "Ten levels of JavaScript quizzes designed to improve your coding skills step by step.",
      
      screenshotUrls: [
        "https://base-jsquiz.vercel.app/og-pro.png",
        "https://base-jsquiz.vercel.app/splash-pro.png"
      ],

      primaryCategory: "education",
      tags: ["javascript", "quiz", "education", "learning", "base"],

      heroImageUrl: "https://base-jsquiz.vercel.app/og-pro.png",
      tagline: "Master JavaScript",

      ogTitle: "JavaScript Quiz Miniapp",
      ogDescription: "Learn JavaScript through ten levels of skill based quizzes.",
      ogImageUrl: "https://base-jsquiz.vercel.app/og-pro.png",

      noindex: false
    }
  };

  return Response.json(manifest);
}