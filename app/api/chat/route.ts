// @ts-nocheck
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      // We'll use the most stable model ID format
      model: google("gemini-1.5-pro"), 
      messages,
    });

    // Check for any valid stream response method
    if (result.toDataStreamResponse) {
      return result.toDataStreamResponse();
    }
    
    if (result.toTextStreamResponse) {
      return result.toTextStreamResponse();
    }

    return result.toAIStreamResponse();
    
  } catch (error: any) {
    console.error("AI Engine Backend Error:", error);
    // This sends the actual error back to your frontend so we can see it
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }), 
      { status: 500 }
    );
  }
}
