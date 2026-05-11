// @ts-nocheck
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const prompt = messages[messages.length - 1].content;

    // Fixed model string to avoid the v1beta error
    const { text } = await generateText({
      model: google("gemini-1.5-flash"), 
      prompt: prompt,
    });

    return new Response(text);
    
  } catch (error: any) {
    console.error("DEBUG - AI Backend Error:", error);
    return new Response(`Error: ${error.message || "API Key issue"}`, { status: 500 });
  }
}
