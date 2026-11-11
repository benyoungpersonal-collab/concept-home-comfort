# COPY-PATTERNS.md: wording patterns for every new site

Use these as shapes, not scripts. Always write original lines in the business's own voice, from their interview answers, reviews, and Google listing. Never copy sentences from another site, a competitor, or a sample below. No em dashes, no "#1" or "best" claims, no filler.

## 1. A plain promise about what customers fear most

Name the fear in plain words, then promise the opposite. The fears that come up most: no-shows, calls that go unanswered, surprise bills, a mess left behind, being pushed into a new system.

- Shape: `[The fear, said plainly]. [What we do instead, with a number or detail].`
- Example (Pinwheel): "A real person answers 7am to 7pm. Emergency line 24/7."
- Example shape for a plumber: "No waiting by the window all day. You get a 2-hour arrival window and a text when we're 20 minutes out."
- Where: the hero note line, the trust row, the request form header.

## 2. A 3-step promise in verbs

Three short sentences, each starting with a verb. It is the whole job in one breath.

- Shape: `We [verb]. We [verb]. We [verb] [it/what matters].`
- Examples: "We look. We quote. We fix it." / "We find the leak. We show you the price. We patch it clean."
- Where: How a visit works (the heading or the line under it), the footer, a text-message signature.

## 3. Trust points with a short reason after each

A label alone is a claim. A label plus why it matters to the customer is a reason to call.

- Shape: `[Trust point]: [why that matters to you].`
- Examples: "Licensed and insured: if something goes wrong, you're covered, not stuck with the bill." / "Background-checked techs: you know who's walking into your home." / "Upfront pricing: you approve the price before we pick up a tool."
- Where: the trust row subs, the proof section, the About page.

## 4. A reviews intro that points to neighbors

Reviews land harder when they come from people nearby. Point to the neighborhood, not the business.

- Shape: `[Neighbors / Your neighbors in City] [say it / tell it] better than we can.`
- Examples: "Neighbors say it better than we can." / "Here's what Manteca homeowners say after we leave."
- Where: the reviews heading. Use real reviews only, word for word, with first name, last initial, and city.

## 5. FAQs written the way customers ask

Write the question the way a homeowner would type it into Google or say it on the phone, not the way the business talks about itself. Answer in 1 to 3 sentences, with a fact or a clear rule of thumb.

- Good: "How do I know if I need a repair or a replacement?" / "Do you charge to come out?" / "Can you come today?" / "Why is my AC running but not cooling?"
- Avoid: "What are our service offerings?" / "Why choose us?"
- Every answer has to be true from their facts, or general advice. Leave out a question when you don't have the fact.

## 6. A named maintenance plan or program

A name makes a plan feel like a membership, not an upsell. Tie the name to the brand, the place, or the promise.

- Shape: `The [Brand word or local word] [Club / Plan / Crew / Pass]`
- Examples: "Comfort Club" (Pinwheel), "[Business short name] Priority Club", "Valley Comfort Plan".
- Follow the name with 3 plain benefits and a price: "Two tune-ups a year, front-of-the-line scheduling, and 15% off repairs. $17 a month."
- Only use a plan the business actually offers. No plan: leave the section off.

## 7. Title case headlines

Hero headlines and section headings use title case: capitalize each word. Small words stay lowercase unless they come first, come last, start a new sentence, or sit right before a comma: a, an, and, as, at, but, by, for, in, nor, of, on, or, per, the, to, vs, via. Capitalize each part of a hyphenated word. Leave words with their own capitals (EV, CA, HVAC) as they are.

- Examples: "Breaker Keeps Tripping? We'll Fix It Right." / "One Call for Every Electrical Job." / "Close By, So We Get There Fast." / "Straight Answers to Common Questions."
- Body text, eyebrows, labels, pills, and buttons stay in normal sentence case.
- Where: the hero headline and every section heading (h1 and h2). The preview build applies it for you (scripts/title-case.mjs); for hand-edited pages run `node scripts/title-case.mjs FILE...`. Sites with all-caps headlines (Pinwheel's bold style) look the same, but the other font styles show it.

## Quick check before a page goes out

- Does every section answer "why call these people" in the business's own words?
- Is there one clear next step (call, text, or request) on every screen?
- Read it out loud. Anything that sounds like a brochure gets rewritten.
- Headlines in title case, everything else in sentence case.
