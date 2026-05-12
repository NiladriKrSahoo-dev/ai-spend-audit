// @ts-nocheck
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!API_KEY) {
      return new Response("Error: API Key missing in Vercel settings.", { status: 500 });
    }

    // Using the stable /v1/ endpoint instead of /v1beta/ to avoid "model not found" errors
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
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
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        }),
      }
    );

    const data = await response.json();

    // Check if Google returned an error object
    if (data.error) {
      console.error("Google API Error Details:", data.error);
      return new Response(`Google API Error: ${data.error.message}`, { status: data.error.code || 500 });
    }

    // Safely extract the text from the response structure
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return new Response("Error: AI returned an empty response format.", { status: 500 });
    }

    return new Response(aiText);

  } catch (error: any) {
    console.error("CRITICAL BACKEND ERROR:", error);
    return new Response(`Backend Crash: ${error.message}`, { status: 500 });
  }
}
