## Day 1 — 2026-05-07

**Hours worked:** 1.5

**What I did:** I Initialized the Next.js 15 project with App Router and Tailwind CSS.

- I started with setting up a professional folder architecture.
- I generated the 11 mandatory project documentation files.
- I Reseached pricing for Cursor, ChatGPT, and Claude.

**What I learned:** How to manage complex project scaffolding in a macOS terminal and the importance of "Defensible Logic" in SaaS auditing.

**Blockers / what I'm stuck on:** Mapping complex seat-based pricing variations into a scalable logic engine architecture.

**Plan for tomorrow:** Build the core TypeScript Audit Engine and design the initial frontend UI.

## Day 2 — 2026-05-08

**Hours worked:** 2.5

**What I did:**

- I developed auditEngine.ts to handle real-time monthly vs. annual savings calculations.
- I designed an Apple-inspired "Liquid Glass" UI using Tailwind CSS backdrop blurs and integrated the frontend with the logic engine.
- Verified the local build and prepared the repository for deployment.

**What I learned:** Advanced CSS techniques for "Squircle" radii and high-density blurs, as well as handling client-side hydration in Next.js 15 for dynamic math.

**Blockers / what I'm stuck on:** Seat minimums (e.g. Claude Team’s 5-seat rule) breaking standard multiplication logic. Resolved this by implementing conditional validation to flag Ghost Seats.

**Plan for tomorrow:** Write the business-specific documentation (GTM.md and Economics.md) and deploy the project live to Vercel.

## Day 3 — 2026-05-09

**Hours worked:** 4

**What I did:**

- I started by trying out a new frontend UI similar to that of the official Credex website.

- I also found a weird bug in the Claude pricing data where the 'Max' plan was showing up as $0. I fixed the settings so it correctly bills at $100 per seat and updated the code so it works for team audits.

- To make sure I don't mess up the data again, I built a "sanity check" helper. It’s basically a script that scans the database and flags anything that looks wrong—like a plan that needs a minimum number of seats but isn't marked as a per-user plan—before it breaks the site.

- I changed the main header from "TOTAL PROJECTED" to "POTENTIAL SAVINGS." I figured out people would get confused on whether if that is how much they are already saving or if they can potentially save.

- I reset the whole form so it starts at 0 seats instead of random numbers. I also updated the storage key to v2 so anyone visiting the site actually sees the new layout instead of old cached data.

- I spent some time fixing a sync issue between my code and the live Vercel site to make sure the version people actually see is the latest one.

**What I learned:**

I realized that writing code to check my own work is way better than trying to manually check 50 different prices myself. It saves me a lot of time and catches things I’d probably miss.

I learned that browser cache is actually pretty annoying. Sometimes you have to change the storage keys just to make sure the user is seeing the most recent version of the app.

**Blockers / what I'm stuck on:**
I got really stuck on a "frozen link" issue with Vercel. I kept pushing new code, but the website wouldn't change because I was looking at an old version of the site without realizing it. It took a while to figure out, but I eventually fixed it by forcing a brand new build.

**Plan for tomorrow:**

I’m going to stop coding for a bit now and focus on the business side too. I need to do three user interviews with actual founders or managers to see what they think of the tool.

I’ll start working on the ECONOMICS.md file to explain the math and how the audit engine actually works in my project.

I want to start writing some automated tests so the pricing logic doesn't break when I add more tools later.

## Day 4 — 2026-05-10

**Hours worked:** 5

**What I did:** Finished the `ECONOMICS.md` file today. I had to run the numbers for LTV, CAC, and figure out how to hit $1M ARR in 18 months. I did a "Profitability Check" to prove the tool actually makes sense as a real business and not just a toy.

**What I learned:** SaaS math is basically just a big logic puzzle. Also, cold outreach is a massive grind. It's way harder to get a founder on a call or message than it is to debug broken code.

**Blockers / what I'm stuck on:** Getting ghosted by everyone on Discord and Slack for the user interviews. It’s so annoying, I’m sending out messages and just getting left on read. 

**Plan for tomorrow:** Hooking up the LLM for the "AI Advice" layer using Vercel AI SDK and finally writing those automated tests so I know for a fact the math isn't going to break.


