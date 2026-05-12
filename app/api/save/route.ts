import { Redis } from '@upstash/redis';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, aiResponse, totals, results } = body;

    if (!email || !aiResponse) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // 1. Safely check for Database Keys
    const dbUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const dbToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!dbUrl || !dbToken) {
      return new Response(JSON.stringify({ error: "Database keys missing" }), { status: 500 });
    }

    // 2. Initialize Database and Save Data
    const redis = new Redis({ url: dbUrl, token: dbToken });
    const shareId = Math.random().toString(36).substring(2, 9);
    
    const auditData = {
      email,
      aiResponse,
      totals,
      results,
      createdAt: Date.now(),
    };

    await redis.set(`audit:${shareId}`, auditData);

    // 3. Send the Transactional Email
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);
      
      // Determine the host for the email link
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';

      try {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: 'Your StackTrim AI Audit is Ready',
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h2>Your AI Spend Audit is Complete</h2>
              <p>We analyzed your SaaS stack and found <strong>$${totals.savings}</strong> in potential monthly savings.</p>
              <p><a href="${protocol}://${host}/audit/${shareId}" style="display: inline-block; padding: 10px 20px; background-color: #111; color: #fff; text-decoration: none; border-radius: 6px;">View Full Report</a></p>
              <p><em>Note: If your report indicates significant waste, a Credex representative will reach out shortly for a free consultation to help you capture those savings.</em></p>
            </div>
          `
        });
      } catch (emailErr) {
         console.error("Email failed to send, but database saved:", emailErr);
         // We don't throw an error here so the user still gets their shareable link even if the email fails.
      }
    } else {
      console.error("CRITICAL: Missing RESEND_API_KEY in Vercel");
    }

    // 4. Return success to the frontend
    return new Response(JSON.stringify({ shareId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({ error: `Server Error: ${error.message}` }), { status: 500 });
  }
}
