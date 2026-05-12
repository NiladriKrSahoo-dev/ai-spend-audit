// @ts-nocheck
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!API_KEY) {
      return new Response("Error: Key missing in Vercel env.", { status: 500 });
    }

    // Using gemini-1.5-flash on v1beta - the most common stable path for AI Studio keys
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return new Response(`Google Error: ${data.error.message}`, { status: 500 });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No content returned.";
    return new Response(aiText);

  } catch (error: any) {
    return new Response(`Server Crash: ${error.message}`, { status: 500 });
  }
}
