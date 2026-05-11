import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: google("models/gemini-1.5-pro-latest"),
    messages,
  });

  // @ts-ignore: Bypass Vercel's strict TypeScript checking
  if (result.toDataStreamResponse) {
    // @ts-ignore
    return result.toDataStreamResponse();
  } else {
    // @ts-ignore - Fallback for slightly older AI SDK versions
    return result.toTextStreamResponse();
  }
}
