// @ts-nocheck
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!API_KEY) {
      return new Response("Config Error: API Key missing in Vercel.", { status: 500 });
    }

    // Direct fetch to the most stable beta endpoint for 1.5 Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          }
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("Google Error Details:", data.error);
      return new Response(`Google Error: ${data.error.message}`, { status: data.error.code || 500 });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return new Response("Error: AI returned empty content structure.", { status: 500 });
    }

    return new Response(aiText);

  } catch (error: any) {
    console.error("Fatal Backend Error:", error);
    return new Response(`Server Crash: ${error.message}`, { status: 500 });
  }
}
