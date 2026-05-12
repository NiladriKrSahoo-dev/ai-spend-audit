# Reflection — Vantage

### 1. The Hardest Bug
The hardest bug was the "Seat Blocker" logic. For single-user plans like "ChatGPT Plus," I wanted the UI to shake if the user tried to add more than 1 seat. Originally, I set it to block if `seats > 0`. This was a "mid" mistake. It meant users couldn't even add the first seat. I had to refactor the condition to `patch.seats > 1` so the first seat worked, but the second one triggered the shake animation. It taught me to always test the "0 to 1" transition, not just the upper limits.

### 2. A Decision I Reversed
Halfway through, I reversed the branding. The project started as "StackTrim." It sounded like a cheap utility. After building the high-contrast, professional UI, I realized it felt like something a CFO would actually use. I renamed it to **Vantage** and updated the entire copy to sound more authoritative. It was a pain to refactor the localStorage keys and the API templates, but it made the product feel 10x more expensive.

### 3. Week 2 Plans
In Week 2, I’d build a "One-Click Migration" tool. Instead of just showing the waste, I'd allow users to connect their team emails and automatically flag which ones haven't logged into their AI tools in 30 days. I’d also add a "Shadow AI" detector to find employees paying for their own Pro seats on personal credit cards.

### 4. AI Usage
I used Claude 3.5 Sonnet to help with the boilerplate for the Framer Motion animations. I didn't trust it with the math—AI is notoriously bad at specific SaaS billing logic (like seat minimums). One time, the AI suggested I use a standard SQL database, but I caught it and switched to Redis because I knew the latency for a simple audit needed to be basically zero.

### 5. Self-Rating (1-10)
- **Discipline (10):** Hit every daily goal and kept the Devlog honest across the entire 6-day sprint.

- **Code Quality (8):** Created clean abstractions and modular logic. While I used @ts-nocheck for some complex motion components to prioritize shipping the MVP, I ensured the production build is highly optimized, **achieving a perfect 100 in Lighthouse Best Practices and SEO.**

- **Design Sense (9):** The **Cinematic Minimalist** look is exactly what Series A CTOs want. I balanced aesthetics with a 91 Accessibility score to ensure the dashboard is professional and inclusive while also being simple enough to understand for newcomers.

- **Problem Solving (9):** Fixed all logic bugs and built a real persistence layer. I successfully resolved technical SEO obstacles (like the noindex challenge) to reach maximum search visibility and technical compliance.

- **Entrepreneurial Thinking (10):** Didn't just build a calculator. I built a high-conversion lead-magnet for Credex that solves a specific capital leakage problem for startups.
