// @ts-nocheck
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!API_KEY) {
      return new Response("Backend Error: API Key missing in Vercel settings.", { status: 500 });
    }

    // Try the primary Flash model first
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

    let data = await response.json();

    // If Flash fails (common for new API keys), immediately try the stable Pro model
    if (data.error) {
      console.warn("Flash failed, attempting Pro fallback...");
      const fallback = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          }),
        }
      );
      data = await fallback.json();
    }

    // Check if even the fallback failed
    if (data.error) {
      return new Response(`Google Error: ${data.error.message}`, { status: 500 });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      return new Response("Backend Error: AI response was empty.", { status: 500 });
    }

    return new Response(aiText);

  } catch (error: any) {
    return new Response(`Server Crash: ${error.message}`, { status: 500 });
  }
}
