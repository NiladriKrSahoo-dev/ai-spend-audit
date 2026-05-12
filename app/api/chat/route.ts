// @ts-nocheck
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!API_KEY) {
      return new Response("Missing GOOGLE_GENERATIVE_AI_API_KEY in Vercel settings.", { status: 500 });
    }

    // Direct REST call to Google Gemini - bypasses all library conflicts
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Google API Error");
    }

    // Extract the text from the Google response format
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from AI.";

    return new Response(aiText);

  } catch (error: any) {
    console.error("BACKEND ERROR:", error);
    return new Response(`Backend Error: ${error.message}`, { status: 500 });
  }
}
