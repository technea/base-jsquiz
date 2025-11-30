export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjE0NDk4NjAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhDMUM1NEZmQWMwNzM5OGRlNjExQjE5QUU3MWM3NjAxQzgyYzI5NWFGIn0",
      payload: "eyJkb21haW4iOiJiYXNlLWpzcXVpei52ZXJjZWwuYXBwIn0",
      signature: "tluJ/iupgN8BPDCk/k6DrzJyql3RJUZJULX7z3fHQY5K2/N3rveIpbXlXFtbM2xdYUyP7Shy/esKER8HftjYJxs="
    },

    // ADD THIS: Your Base account address (replace with your actual address)
    baseBuilder: {
      ownerAddress: "0x0881e4c7b81dc36fc4fc1c82ce0e97bbb0134f93" // ← REPLACE THIS
    },

    // CHANGE 'frame' to 'miniapp' and remove unsupported properties
    miniapp: { 
      version: "1",
      name: "JavaScript Quiz Miniapp",
      homeUrl: "https://base-jsquiz.vercel.app",
      iconUrl: "https://base-jsquiz.vercel.app/icon-pro.png",
      splashImageUrl: "https://base-jsquiz.vercel.app/splash-pro.png",
      splashBackgroundColor: "#0f172a",
      webhookUrl: "https://base-jsquiz.vercel.app/api/webhook",

      subtitle: "Test Your Skills",
      description: "Test your JavaScript skills with 10 challenging quiz levels from beginner to advanced.",
      
      screenshotUrls: [
        "https://base-jsquiz.vercel.app/og-pro.png",
        "https://base-jsquiz.vercel.app/splash-pro.png"
      ],

      primaryCategory: "education",
      tags: ["javascript", "quiz", "education", "learning", "base"],

      heroImageUrl: "https://base-jsquiz.vercel.app/og-pro.png",
      tagline: "Master JavaScript",
      ogTitle: "Master JavaScript: Quiz Miniapp",
      ogDescription: "Master JavaScript with 10 quiz levels from beginner to advanced.",
      ogImageUrl: "https://base-jsquiz.vercel.app/og-pro.png",
      
      // REMOVE these - they're not supported in miniapp structure:
      // imageUrl: "https://base-jsquiz.vercel.app/og-pro.png",
      // buttonTitle: "Start Quiz",

      noindex: false
    }
  };

  return Response.json(manifest);
}