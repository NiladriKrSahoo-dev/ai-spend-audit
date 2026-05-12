// @ts-nocheck
export const maxDuration = 30;

async function tryGemini(modelName: string, apiKey: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
    }
  );
  return response;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;
    const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!API_KEY) return new Response("Error: API Key missing in Vercel.", { status: 500 });

    // Try Model 1: gemini-1.5-flash
    let response = await tryGemini("gemini-1.5-flash", API_KEY, prompt);
    let data = await response.json();

    // If failed, Try Model 2: gemini-1.5-flash-latest
    if (data.error) {
      console.warn("Flash failed, trying Flash-Latest...");
      response = await tryGemini("gemini-1.5-flash-latest", API_KEY, prompt);
      data = await response.json();
    }

    // If still failed, Try Model 3: gemini-pro (The original stable model)
    if (data.error) {
      console.warn("Flash-Latest failed, trying Gemini-Pro fallback...");
      response = await tryGemini("gemini-pro", API_KEY, prompt);
      data = await response.json();
    }

    if (data.error) {
      return new Response(`Google Final Error: ${data.error.message}`, { status: 500 });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) return new Response("Error: Empty AI Response", { status: 500 });

    return new Response(aiText);

  } catch (error: any) {
    return new Response(`Server Crash: ${error.message}`, { status: 500 });
  }
}
