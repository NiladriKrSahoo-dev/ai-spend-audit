// @ts-nocheck
import { generateText } from "ai"; // Use generateText for a simpler response
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;

    const { text } = await generateText({
      model: google("gemini-1.5-pro-latest"),
      prompt: prompt,
    });

    // Send back pure text that our frontend can read instantly
    return new Response(text);
    
  } catch (error: any) {
    console.error("AI Error:", error);
    return new Response("AI is temporarily unavailable. Check your API key.", { status: 500 });
  }
}
