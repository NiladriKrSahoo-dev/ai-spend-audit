// @ts-nocheck
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!API_KEY) return new Response("Error: API Key missing in Vercel Settings.", { status: 500 });

    // We will loop through the three most likely endpoints until one hits a 200 OK
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        const data = await response.json();
        
        // If we get a valid response, return it and stop the loop
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return new Response(data.candidates[0].content.parts[0].text);
        }
        
        console.warn(`Attempt failed for ${url}:`, data.error?.message);
      } catch (e) {
        console.error(`Fetch crash for ${url}`);
      }
    }

    return new Response("Google API Error: All model endpoints failed. Please verify your API Key is active in Google AI Studio and not restricted.", { status: 500 });

  } catch (error: any) {
    return new Response(`Fatal Server Crash: ${error.message}`, { status: 500 });
  }
}
