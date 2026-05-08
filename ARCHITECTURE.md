# AI Spend Audit - How It Works

## The Simple Breakdown

The AI Spend Audit tool uses a very fast, built-in "calculator" (found at `src/lib/audit/auditEngine.ts`) to figure out how much money you could save on your AI subscriptions. Here is a simple explanation of how information moves through the app and how the math works.

### 1. Where the Pricing Data Lives
To make the app lightning fast, we don't look up prices from an external database or read files while you're using it. Instead, all the verified prices from our research (like Cursor, ChatGPT, and Claude) are hardcoded directly into the app's code as a "cheat sheet" called `PRICING_DB`. 

For every tool, the cheat sheet knows:
- Monthly Price: How much it costs if you pay month-to-month.
- Annual Price: The cheaper monthly rate you get if you pay for a whole year upfront.
- Minimum Seats: Whether a plan requires you to buy a minimum number of licenses (e.g., Claude Team requires 5 seats).
- Per User vs. Flat Fee: Whether the price is per person or just one flat rate.

### 2. Checking the User's Input
When you select a tool, choose a plan, and type in how many seats you need, the app runs a quick safety check before doing any math:
1. Tool Check: It makes sure the tool you selected actually exists in our cheat sheet.
2. Plan Check: It makes sure the plan you picked is a real plan for that tool.
3. "Contact Sales" Check: If you pick a huge Enterprise plan that doesn't list a public price (it just says "Contact Sales"), the app stops right there. It tells you that it can't calculate savings automatically because it doesn't know the secret price.

### 3. Finding the Savings
Once the input is verified, the app acts like a smart accountant and looks for two main ways to save you money:

#### A. Monthly vs. Annual Billing
First, it checks how often you pay. 
- If you told the app you are currently paying Monthly, it peeks at the cheat sheet to see if the tool offers an Annual discount. 
- If an annual discount exists, the app calculates exactly how much less you would spend per month by committing to a yearly plan. It records this difference as an "Annual Switch" saving opportunity.

#### B. Catching "Ghost Seats"
Sometimes, team plans trick you. A plan might cost $30/user but require a minimum of 5 users. If you only have 3 people on your team, you are forced to pay for 2 empty chairs—we call these "Ghost Seats."
- The app detects this: it notices that your team size (3) is smaller than the required minimum (5).
- It then calculates a backup plan: *What if, instead of buying the Team plan for 5 people, you just bought 3 separate Individual "Pro" plans?*
- If buying the individual plans is cheaper than paying for the team minimum, the app flags this as a "Ghost Seat" saving opportunity and recommends you downgrade.

### 4. Giving You the Results
Finally, the app gathers up your current spending, the cheaper optimized spending, and the total money you could save. It bundles all this information (along with handy tips, like "Switch to annual billing!") and sends it straight to the screen for you to see.
