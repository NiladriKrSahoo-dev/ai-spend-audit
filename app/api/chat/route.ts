// @ts-nocheck
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!API_KEY) {
      return new Response("Backend Error: API Key is missing in Vercel settings.", { status: 500 });
    }

    // We are using v1beta here because it is the most compatible with gemini-1.5-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
      }
    );

    const data = await response.json();

    // Check for Google-specific errors (like the "model not found" one)
    if (data.error) {
      console.error("Google Server Error:", data.error);
      return new Response(`Google Error: ${data.error.message}`, { status: data.error.code || 500 });
    }

    // Extracting the text from Google's candidates array
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return new Response("Backend Error: AI returned empty content.", { status: 500 });
    }

    // Return the pure text
    return new Response(aiText);

  } catch (error: any) {
    console.error("CRITICAL BACKEND CRASH:", error);
    return new Response(`Server Crash: ${error.message}`, { status: 500 });
  }
}
