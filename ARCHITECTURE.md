# The Simple Breakdown - How it Works:
The Vantage Audit Engine acts like a smart, high-speed accountant. Here is how the information moves through the app:

1. Where the Pricing Data Lives

To make the app lightning fast, it doesn't look up prices from an external database while you're using it. All verified prices for tools like Cursor, ChatGPT, and Claude are hardcoded into a "cheat sheet" called PRICING_DB.

Monthly vs. Annual Price: We know the cheaper rate you get if you pay yearly.

Minimum Seats: We know if a plan (like Claude Team) requires at least 5 people.

Billing Type: We know if the price is per-person or a flat fee.

2. Finding the Savings (The Math)

The engine hunts for two main ways to save a company money:

The Annual Switch: If you pay monthly, it calculates exactly how much you'd save by switching to an annual plan.

Ghost Seats: Many team plans have seat minimums. If you have 3 people but pay for a 5-seat minimum plan, you're paying for 2 "Ghost Seats." It calculates if buying individual Pro licenses would be cheaper and recommend that instead.

3. Data Flow & Security

Analysis: Your data is stored locally in your browser for instant results.

Storage: When you "Generate" a report, we save a copy to Upstash Redis (a secure, fast cloud database) so you can share a permanent link with your team.

Notification: It uses the Resend API to send a summary of these savings straight to your inbox.
# System Architecture — Vantage

## Technical System Diagram
This diagram shows how data moves from your browser, through the serverless backend, and into the cloud database.

```mermaid
graph TD
    A[User / Browser] -->|Input SaaS Config| B[Audit Engine]
    B -->|Calculate Real-time Savings| A
    A -->|Submit Email / POST| C[Next.js API Route /api/save]
    
    subgraph Vercel Serverless Environment
        C -->|1. Generate Summary| D[Vercel AI SDK / LLM]
        C -->|2. Store JSON Payload| E[(Upstash Redis KV)]
        C -->|3. Trigger Email| F[Resend API]
    end
    
    E -->|Fetch by ID| G[Dynamic Route /audit/id]
    G -->|Render Static Report| A
    F -->|Inbox Notification| H[User Email]
