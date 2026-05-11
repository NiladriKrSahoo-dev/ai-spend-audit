import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30; // Allows the AI more time to "think" on Vercel

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google("gemini-1.5-pro-latest"),
      messages,
    });

    // This part is CRITICAL: It handles the hand-off between Gemini and your UI
    // @ts-ignore
    if (result.toDataStreamResponse) { 
      return result.toDataStreamResponse(); 
    }
    
    // @ts-ignore - Fallback for older SDK versions
    return result.toTextStreamResponse();
    
  } catch (error: any) {
    console.error("AI Engine Backend Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate AI response." }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
