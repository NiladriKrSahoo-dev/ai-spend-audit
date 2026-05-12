// @ts-nocheck
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!API_KEY) return new Response("Error: API Key missing in Vercel.", { status: 500 });

    // 2026 Model List: Trying the most stable current models
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key=${API_KEY}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        const data = await response.json();
        
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return new Response(data.candidates[0].content.parts[0].text);
        }
        
        console.warn(`Failed attempt for ${url}:`, data.error?.message);
      } catch (e) {
        console.error(`Fetch failed for ${url}`);
      }
    }

    return new Response("Google API Error: All current 2026 model endpoints failed. Ensure your API Key is not 'Restricted' in Google AI Studio Settings.", { status: 500 });

  } catch (error: any) {
    return new Response(`Fatal Server Crash: ${error.message}`, { status: 500 });
  }
}
