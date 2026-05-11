import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// This allows the function to run for up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { totalSavings, topWasteTool, currentSpend } = await req.json();

  const result = await streamText({
    model: google('gemini-1.5-flash'),
    system: `You are a Senior Strategic Advisor for Credex. 
             Provide executive-level fiscal insights. 
             Focus on ROI and reallocating wasted budget. 
             Tone: Professional, direct, and sophisticated.`,
    prompt: `The audit identified $${totalSavings}/mo in potential savings from ${topWasteTool}. 
             Total current AI expenditure is $${currentSpend}/mo. 
             Provide a 2-sentence strategic recommendation for a CFO on how to optimize this budget.`
  });

  return result.toDataStreamResponse();
}