// @ts-nocheck
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google("gemini-1.5-pro-latest"),
      messages,
    });

    // Check if the new method exists, otherwise use the standard text stream
    if (result.toDataStreamResponse) {
      return result.toDataStreamResponse();
    }
    
    return result.toTextStreamResponse();
    
  } catch (error: any) {
    console.error("AI Engine Backend Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate AI response." }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
