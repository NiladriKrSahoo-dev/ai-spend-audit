import { Redis } from '@upstash/redis';

// Initialize Redis explicitly using the Vercel KV environment variables
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, aiResponse, totals, results } = body;

    if (!email || !aiResponse) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Generate a unique 7-character ID
    const shareId = Math.random().toString(36).substring(2, 9);

    // Package the audit data
    const auditData = {
      email,
      aiResponse,
      totals,
      results,
      createdAt: Date.now(),
    };

    // Save to Upstash Redis using the ID as the key
    await redis.set(`audit:${shareId}`, auditData);

    // Return the ID back to the frontend
    return new Response(JSON.stringify({ shareId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Database Error:", error);
    return new Response(`Database Server Error: ${error.message}`, { status: 500 });
  }
}
