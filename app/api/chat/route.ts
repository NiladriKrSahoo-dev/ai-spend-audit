// @ts-nocheck
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;

    // We'll use the most stable model name string
    const { text } = await generateText({
      model: google("gemini-1.5-pro"),
      prompt: prompt,
    });

    return new Response(text);
    
  } catch (error: any) {
    console.error("DEBUG - AI Backend Error:", error);
    // If this shows up, your GOOGLE_GENERATIVE_AI_API_KEY is missing or invalid in Vercel
    return new Response(`Error: ${error.message || "API Key issue"}`, { status: 500 });
  }
}
